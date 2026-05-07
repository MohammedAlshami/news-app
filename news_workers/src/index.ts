const TARGET_URL = "https://news-site.mshami2021.workers.dev/api/cron/update-price-rates"

export default {
  async fetch(request: Request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 })
    }
    if (request.method === "HEAD") {
      return new Response(null, { status: 200 })
    }
    const res = await fetch(TARGET_URL, {
      headers: { accept: "application/json", "user-agent": "news-rate-worker/1.0" },
    })
    return new Response(await res.text(), {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json; charset=utf-8",
      },
    })
  },

  async scheduled() {
    await fetch(TARGET_URL, {
      headers: { accept: "application/json", "user-agent": "news-rate-worker/1.0" },
    })
  },
}

