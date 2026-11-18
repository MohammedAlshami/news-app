import { getCategoriesCached } from "@/lib/db-site-cache.server"
import { getRssArticles, memoFeed } from "@/lib/db-sitemap.server"
import { FEED_CACHE_CONTROL, HOME_DESCRIPTION, RSS_PATH, SITE_NAME, absoluteUrl, buildRssXml } from "@/lib/seo"
import { getArticlePath } from "@/lib/site-routes"

export const dynamic = "force-dynamic"

export async function GET() {
  const xml = await memoFeed("rss", 60_000, async () => {
    const [rows, cats] = await Promise.all([getRssArticles(50), getCategoriesCached()])
    const nameById = new Map(cats.map((c) => [c.id, c.name]))
    return buildRssXml({
      title: SITE_NAME,
      link: absoluteUrl("/"),
      description: HOME_DESCRIPTION,
      selfUrl: absoluteUrl(RSS_PATH),
      items: rows.map((r) => ({
        title: r.title,
        link: absoluteUrl(getArticlePath(r.id)),
        description: r.excerpt,
        pubDate: r.createdAt,
        category: r.categoryId ? nameById.get(r.categoryId) : undefined,
        imageUrl: r.coverImageUrl?.trim() ? absoluteUrl(r.coverImageUrl.trim()) : null,
      })),
    })
  })
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": FEED_CACHE_CONTROL },
  })
}
