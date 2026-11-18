// Scheduler Worker. Every cron trigger runs ONE bounded step against the site Worker (service binding):
//
//   "*/10 * * * *"      write    – up to 4 articles/updates (+ health check, + prices every 30 min)
//   "3-59/10 * * * *"   cluster  – cluster pending rows into topics
//   "6-59/10 * * * *"   scrape   – a rotating slice of the sources (each source once per hour)
//
// Steps are offset by minutes so they rarely overlap, and the site additionally holds a lease per step
// (overlap → "busy", not double work). Each step awaits its work with a hard timeout and logs ONE JSON line.
// No public `fetch` handler: the pipeline can only be started by cron (or by an admin on the site itself).
const SOURCE_KEYS = [
  "rt", "independent", "bbc", "youm7", "skynews", "alquds",
  "elwatan", "alaraby", "aawsat", "shabiba", "addustour",
]
/** The scrape trigger fires 6× per hour; source i belongs to slot i % 6. */
const SLOTS_PER_HOUR = 6

type Env = { NEWS_SITE: { fetch: (input: URL | Request | string, init?: RequestInit) => Promise<Response> }; CRON_SECRET?: string }

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function callSite(env: Env, path: string, timeoutMs: number): Promise<{ status: number; body: string }> {
  const res = await env.NEWS_SITE.fetch(new URL(`https://internal${path}`), {
    headers: {
      accept: "application/json",
      "user-agent": "news-cron-worker/2.0",
      authorization: `Bearer ${env.CRON_SECRET}`,
    },
    signal: AbortSignal.timeout(timeoutMs),
  })
  return { status: res.status, body: (await res.text()).slice(0, 1500) }
}

async function step(env: Env, name: string, path: string, timeoutMs: number): Promise<Record<string, unknown>> {
  const started = Date.now()
  try {
    const { status, body } = await callSite(env, path, timeoutMs)
    const ok = status >= 200 && status < 300
    const out = { step: name, status, ok, ms: Date.now() - started, body: ok ? undefined : body }
    if (!ok) console.error(JSON.stringify({ ...out, level: "error" }))
    return out
  } catch (e) {
    const out = { step: name, ok: false, ms: Date.now() - started, error: String(e) }
    console.error(JSON.stringify({ ...out, level: "error" }))
    return out
  }
}

export function sourcesForSlot(slot: number): string[] {
  return SOURCE_KEYS.filter((_, i) => i % SLOTS_PER_HOUR === slot % SLOTS_PER_HOUR)
}

/** Which step a cron expression stands for (kept in sync with wrangler.toml). */
export function stepFor(cron: string): "write" | "cluster" | "scrape" | null {
  if (cron === "*/10 * * * *") return "write"
  if (cron === "3-59/10 * * * *") return "cluster"
  if (cron === "6-59/10 * * * *") return "scrape"
  return null
}

export async function runStep(kind: "write" | "cluster" | "scrape", env: Env, scheduledTime: number): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = []
  const d = new Date(scheduledTime)
  const minute = d.getUTCMinutes()
  if (kind === "write") {
    out.push(await step(env, "write", "/api/cron/write-pipeline", 280_000))
    out.push(await step(env, "health", "/api/cron/health", 20_000))
    if (minute % 30 === 0) out.push(await step(env, "price-rates", "/api/cron/update-price-rates", 40_000))
  } else if (kind === "cluster") {
    out.push(await step(env, "cluster", "/api/cron/cluster", 200_000))
  } else {
    const slot = Math.floor(minute / 10) % SLOTS_PER_HOUR
    for (const key of sourcesForSlot(slot)) {
      out.push(await step(env, `scrape/${key}`, `/api/cron/scrape-source/${key}`, 90_000))
      await delay(2000)
    }
  }
  return out
}

export default {
  async scheduled(event: { cron: string; scheduledTime: number }, env: Env) {
    if (!env.CRON_SECRET || env.CRON_SECRET.length < 16) {
      console.error(JSON.stringify({ level: "error", error: "CRON_SECRET is not set on the scheduler Worker (wrangler secret put CRON_SECRET)" }))
      return
    }
    const kind = stepFor(event.cron)
    if (!kind) {
      console.error(JSON.stringify({ level: "error", error: `unknown cron expression: ${event.cron}` }))
      return
    }
    const results = await runStep(kind, env, event.scheduledTime)
    console.log(JSON.stringify({ cron: event.cron, kind, results }))
    const health = results.find((r) => r.step === "health")
    if (health && health.ok === false) console.error(JSON.stringify({ level: "error", alert: "HEALTH ALERT", detail: health }))
  },
}
