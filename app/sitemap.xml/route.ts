import { getCategoriesCached } from "@/lib/db-site-cache.server"
import { getSitemapArticles, memoFeed } from "@/lib/db-sitemap.server"
import { FEED_CACHE_CONTROL, absoluteUrl, buildSitemapXml, type SitemapEntry } from "@/lib/seo"
import { ALL_CATEGORIES_ID, getArticlePath, getCategoryPagePath } from "@/lib/site-routes"

// Route handler (not app/sitemap.ts) so we control Cache-Control; `/sitemap.xml` is the same URL.
export const dynamic = "force-dynamic"

export async function GET() {
  const xml = await memoFeed("sitemap", 60_000, async () => {
    const [rows, cats] = await Promise.all([getSitemapArticles(), getCategoriesCached()])
    const newest = rows[0]?.updatedAt
    const entries: SitemapEntry[] = [
      { loc: absoluteUrl("/"), lastmod: newest, changefreq: "hourly", priority: 1 },
      { loc: absoluteUrl(getCategoryPagePath(ALL_CATEGORIES_ID)), lastmod: newest, changefreq: "hourly", priority: 0.6 },
      ...cats.map((c) => ({
        loc: absoluteUrl(getCategoryPagePath(c.slug)),
        lastmod: newest,
        changefreq: "hourly" as const,
        priority: 0.7,
      })),
      ...rows.map((r) => ({
        loc: absoluteUrl(getArticlePath(r.id)),
        // updatedAt exists on `articles`; fall back to createdAt defensively.
        lastmod: r.updatedAt ?? r.createdAt,
        changefreq: "weekly" as const,
        priority: 0.8,
      })),
    ]
    return buildSitemapXml(entries.slice(0, 50_000))
  })
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": FEED_CACHE_CONTROL },
  })
}
