const SOURCE_KEYS = [
  "rt", "independent", "bbc", "youm7", "skynews", "alquds",
  "elwatan", "alaraby", "alhurra", "aawsat", "shabiba", "addustour",
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
  const res = await env.NEWS_SITE.fetch(url, {
    headers: { accept: "text/event-stream", "user-agent": "news-cron-worker/1.0" },
  })
  const body = await res.text()
  return `${label}: ${res.status}`
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

export default {
  async fetch(request: Request, env: any) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 })
    }

    const lines = await processAllSources(env, 2000)
    const write = await fetchCron(env, "/api/cron/write-pipeline", "write")
    const price = await fetchCron(env, "/api/cron/update-price-rates", "price-rates")
    lines.push(write, price)

    return new Response(lines.join("\n"), {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  },

  async scheduled(_event: any, env: any) {
    const now = new Date()
    const minute = now.getUTCMinutes()

    // Scrape every hour on the hour
    if (minute === 0) {
      const lines = await processAllSources(env, 5000)
      for (const line of lines) console.log(line)
    }

    // Write every 10 minutes
    const write = await fetchCron(env, "/api/cron/write-pipeline", "write")
    console.log(write)

    const price = await fetchCron(env, "/api/cron/update-price-rates", "price-rates")
    console.log(price)
  },
}
