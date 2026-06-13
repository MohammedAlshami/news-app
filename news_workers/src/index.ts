const SOURCE_KEYS = [
  "rt", "independent", "bbc", "youm7", "skynews", "alquds",
  "elwatan", "alaraby", "alhurra", "aawsat", "shabiba", "addustour",
]

async function fetchSource(env: any, key: string): Promise<string> {
  const url = new URL(`https://internal/api/cron/scrape-source/${key}`)
  const res = await env.NEWS_SITE.fetch(url, {
    headers: { accept: "application/json", "user-agent": "news-cron-worker/1.0" },
  })
  const body = await res.text()
  return `scrape/${key}: ${res.status}`
}

async function fetchCron(env: any, path: string, label: string): Promise<string> {
  const url = new URL(`https://internal${path}`)
  const res = await env.NEWS_SITE.fetch(url, {
    headers: { accept: "text/event-stream", "user-agent": "news-cron-worker/1.0" },
  })
  const body = await res.text()
  return `${label}: ${res.status}`
}

export default {
  async fetch(request: Request, env: any) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 })
    }

    const lines: string[] = []

    const sourceResults = await Promise.allSettled(
      SOURCE_KEYS.map((key) => fetchSource(env, key)),
    )
    lines.push(...sourceResults.map((r) =>
      r.status === "fulfilled" ? r.value : `scrape: ${r.reason}`,
    ))

    const otherResults = await Promise.allSettled([
      fetchCron(env, "/api/cron/group-pipeline", "group"),
      fetchCron(env, "/api/cron/generate-pipeline?limit=10", "generate"),
      fetchCron(env, "/api/cron/update-price-rates", "price-rates"),
    ])
    lines.push(...otherResults.map((r) =>
      r.status === "fulfilled" ? r.value : `${r.reason}`,
    ))

    return new Response(lines.join("\n"), {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  },

  async scheduled(_event: any, env: any) {
    const sourceResults = await Promise.allSettled(
      SOURCE_KEYS.map((key) => fetchSource(env, key)),
    )
    for (const r of sourceResults) {
      if (r.status === "fulfilled") console.log(r.value)
      else console.error(`scrape failed: ${r.reason}`)
    }

    const otherResults = await Promise.allSettled([
      fetchCron(env, "/api/cron/group-pipeline", "group"),
      fetchCron(env, "/api/cron/generate-pipeline?limit=10", "generate"),
      fetchCron(env, "/api/cron/update-price-rates", "price-rates"),
    ])
    for (const r of otherResults) {
      if (r.status === "fulfilled") console.log(r.value)
      else console.error(`Cron failed: ${r.reason}`)
    }
  },
}
