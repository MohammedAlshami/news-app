/**
 * Fetches BBC News RSS and returns the latest items as JSON.
 * RSS is the supported public feed; no HTML scraping.
 */
const BBC_NEWS_RSS = "https://feeds.bbci.co.uk/news/rss.xml";

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid?: string;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function extractCdataOrText(raw: string): string {
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  const inner = cdata ? cdata[1] : raw;
  return decodeBasicEntities(inner.trim());
}

function firstTag(block: string, tag: string): string {
  const re = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
    "i",
  );
  const m = block.match(re);
  if (!m) return "";
  return extractCdataOrText(m[1].trim());
}

function parseRssItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = stripTags(firstTag(block, "title"));
    const link = stripTags(firstTag(block, "link"));
    const description = stripTags(firstTag(block, "description"));
    const pubDate = stripTags(firstTag(block, "pubDate"));
    const guid = stripTags(firstTag(block, "guid"));
    if (title && link) {
      items.push({ title, link, description, pubDate, guid: guid || undefined });
    }
  }
  return items;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20),
    );

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const rssRes = await fetch(BBC_NEWS_RSS, {
        headers: {
          "User-Agent": "news-worker/1.0 (Cloudflare Worker)",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
      });

      if (!rssRes.ok) {
        return Response.json(
          {
            error: "Upstream RSS request failed",
            status: rssRes.status,
          },
          { status: 502 },
        );
      }

      const xml = await rssRes.text();
      const items = parseRssItems(xml).slice(0, limit);

      const body = JSON.stringify(
        {
          source: "BBC News (RSS)",
          feed: BBC_NEWS_RSS,
          fetchedAt: new Date().toISOString(),
          count: items.length,
          items,
        },
        null,
        2,
      );

      return new Response(request.method === "HEAD" ? null : body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      return Response.json({ error: message }, { status: 500 });
    }
  },
};
