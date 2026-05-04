/**
 * Daily cron trigger.
 * This worker calls the main app's scrape endpoint, which fetches RT Arabic and
 * Independent Arabia categories and persists them into D1.
 */

const TARGET_URL =
  "https://news-site.mshami2021.workers.dev/api/cron/scrape-news";

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (request.method === "HEAD") {
      return new Response(null, { status: 200 })
    }

    const res = await fetch(TARGET_URL, {
      headers: {
        accept: "application/json",
        "user-agent": "news-worker-cron/1.0",
      },
    })
    const text = await res.text()
    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json; charset=utf-8",
      },
    })
  },

  async scheduled(): Promise<void> {
    await fetch(TARGET_URL, {
      headers: {
        accept: "application/json",
        "user-agent": "news-worker-cron/1.0",
      },
    })
  },
}
