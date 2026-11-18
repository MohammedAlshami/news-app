import { getNewsSitemapArticles, memoFeed } from "@/lib/db-sitemap.server"
import { FEED_CACHE_CONTROL, absoluteUrl, buildNewsSitemapXml } from "@/lib/seo"
import { getArticlePath } from "@/lib/site-routes"

export const dynamic = "force-dynamic"

export async function GET() {
  const xml = await memoFeed("news-sitemap", 60_000, async () => {
    const rows = await getNewsSitemapArticles()
    return buildNewsSitemapXml(
      rows.map((r) => ({ loc: absoluteUrl(getArticlePath(r.id)), title: r.title, publishedAt: r.createdAt })),
    )
  })
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": FEED_CACHE_CONTROL },
  })
}
