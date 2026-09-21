const SOURCE_KEYS = [
  "rt", "independent", "bbc", "youm7", "skynews", "alquds",
  "elwatan", "alaraby", "aawsat", "shabiba", "addustour",
]

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchSource(env: any, key: string): Promise<string> {
  const url = new URL(`https://internal/api/cron/scrape-source/${key}`)
  const res = await env.NEWS_SITE.fetch(url, {
    headers: { accept: "application/json", "user-agent": "news-cron-worker/1.0" },
  })
  return `scrape/${key}: ${res.status}`
}

async function fetchCron(env: any, path: string, label: string): Promise<string> {
  const url = new URL(`https://internal${path}`)
  try {
    const res = await env.NEWS_SITE.fetch(url, {
      headers: { accept: "text/event-stream", "user-agent": "news-cron-worker/1.0" },
    })
    const body = await res.text()
    // Surface failures in the Worker logs instead of only a status code.
    if (!res.ok || /event: error/.test(body)) console.error(`${label} FAILED (${res.status}): ${body.slice(0, 500)}`)
    return `${label}: ${res.status}`
  } catch (e) {
    console.error(`${label} threw: ${e}`)
    return `${label}: ERR ${e}`
  }
}

/** Alerts land in the Worker logs (wrangler tail / Workers Logs) as console.error. */
async function checkHealth(env: any): Promise<string> {
  try {
    const res = await env.NEWS_SITE.fetch(new URL("https://internal/api/cron/health"), {
      headers: { accept: "application/json", "user-agent": "news-cron-worker/1.0" },
    })
    const body = await res.text()
    if (res.status !== 200) console.error(`HEALTH ALERT: ${body}`)
    return `health: ${res.status}`
  } catch (e) {
    console.error(`health threw: ${e}`)
    return `health: ERR ${e}`
  }
}

async function processAllSources(env: any, staggerMs: number): Promise<string[]> {
  const lines: string[] = []
  for (const key of SOURCE_KEYS) {
    const r = await fetchSource(env, key).catch((e) => `scrape/${key}: ${e}`)
    lines.push(r)
    await delay(staggerMs)
  }
  return lines
}

/** One pipeline tick. Every step is idempotent, so retries and overlaps are safe. */
async function pipelineTick(env: any, scrape: boolean, staggerMs: number): Promise<string[]> {
  const lines: string[] = []
  if (scrape) lines.push(...(await processAllSources(env, staggerMs)))
  // cluster once per tick (also retries anything a previous tick left pending), then write
  lines.push(await fetchCron(env, "/api/cron/cluster", "cluster"))
  lines.push(await fetchCron(env, "/api/cron/write-pipeline", "write"))
  lines.push(await fetchCron(env, "/api/cron/update-price-rates", "price-rates"))
  lines.push(await checkHealth(env))
  return lines
}

export default {
  async fetch(request: Request, env: any) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 })
    }
    const lines = await pipelineTick(env, true, 2000)
    return new Response(lines.join("\n"), {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  },

  async scheduled(_event: any, env: any) {
    const minute = new Date().getUTCMinutes()
    // Scrape on the hour; cluster + write + prices + health check on every 10-minute tick.
    const lines = await pipelineTick(env, minute === 0, 5000)
    for (const line of lines) console.log(line)
  },
}
