/**
 * Pure SEO helpers (no I/O, no `server-only`) so they can be unit-tested and used from
 * metadata functions, route handlers and server components alike.
 */

export const DEFAULT_SITE_URL = "https://news-site.mshami2021.workers.dev"
export const SITE_NAME = "أخبار"
export const SITE_LOCALE = "ar_AR"
export const SITE_LANGUAGE = "ar"
export const HOME_TITLE = "أخبار | آخر الأخبار والتقارير العربية"
export const HOME_DESCRIPTION =
  "أخبار: موقع إخباري عربي يقدّم آخر الأخبار والتقارير في السياسة والاقتصاد والرياضة والتقنية وغيرها، بملخصات واضحة وأقسام متنوعة."
export const RSS_PATH = "/rss.xml"

/** Canonical origin (no trailing slash). Reads `SITE_URL` at call time so Worker vars apply. */
export function siteUrl(): string {
  const raw = (process.env.SITE_URL ?? "").trim()
  if (raw) {
    try {
      const u = new URL(raw)
      if (u.protocol === "https:" || u.protocol === "http:") return u.origin
    } catch {
      // fall through to default
    }
  }
  return DEFAULT_SITE_URL
}

/** Absolute URL for a site path; absolute http(s) inputs are returned unchanged. */
export function absoluteUrl(pathOrUrl: string): string {
  const v = (pathOrUrl ?? "").trim()
  if (/^https?:\/\//i.test(v)) return v
  return `${siteUrl()}${v.startsWith("/") ? v : `/${v}`}`
}

/** `alternates` block shared by pages (child `alternates` replaces the parent's, so repeat the RSS link). */
export function alternatesFor(canonicalPath: string) {
  return {
    canonical: canonicalPath,
    types: { "application/rss+xml": RSS_PATH },
  }
}

/** Serialise JSON-LD for an inline `<script>`; neutralises `</script>` and HTML-significant characters. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

type JsonLd = Record<string, unknown>

function organization(): JsonLd {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl(),
    logo: { "@type": "ImageObject", url: absoluteUrl("/logo-light.svg") },
  }
}

export function buildWebsiteJsonLd(): JsonLd[] {
  const url = siteUrl()
  return [
    { "@context": "https://schema.org", ...organization(), "@id": `${url}/#organization` },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${url}/#website`,
      url,
      name: SITE_NAME,
      inLanguage: SITE_LANGUAGE,
      publisher: { "@id": `${url}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${url}/search?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ]
}

export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  }
}

export type NewsArticleLdInput = {
  path: string
  title: string
  description: string
  images: string[]
  datePublished: Date
  dateModified: Date
  memberOnly?: boolean
  section?: string
}

export function buildNewsArticleJsonLd(a: NewsArticleLdInput): JsonLd {
  const url = absoluteUrl(a.path)
  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: a.title.slice(0, 110),
    description: a.description,
    inLanguage: SITE_LANGUAGE,
    datePublished: a.datePublished.toISOString(),
    dateModified: a.dateModified.toISOString(),
    author: organization(),
    publisher: organization(),
    isAccessibleForFree: !a.memberOnly,
  }
  if (a.images.length > 0) ld.image = a.images.map(absoluteUrl)
  if (a.section) ld.articleSection = a.section
  if (a.memberOnly) {
    ld.hasPart = {
      "@type": "WebPageElement",
      isAccessibleForFree: false,
      cssSelector: ".article-body",
    }
  }
  return ld
}

// ---------------------------------------------------------------------------
// XML builders
// ---------------------------------------------------------------------------

/** Escape text/attribute content and drop characters that are illegal in XML 1.0. */
export function escapeXml(s: string): string {
  return String(s)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

const XML_DECL = '<?xml version="1.0" encoding="UTF-8"?>\n'

export type SitemapEntry = {
  loc: string
  lastmod?: Date
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: number
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((e) => {
      let x = `<url><loc>${escapeXml(e.loc)}</loc>`
      if (e.lastmod) x += `<lastmod>${e.lastmod.toISOString()}</lastmod>`
      if (e.changefreq) x += `<changefreq>${e.changefreq}</changefreq>`
      if (e.priority !== undefined) x += `<priority>${e.priority.toFixed(1)}</priority>`
      return `${x}</url>`
    })
    .join("\n")
  return `${XML_DECL}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export type NewsSitemapEntry = { loc: string; title: string; publishedAt: Date }

export function buildNewsSitemapXml(
  entries: NewsSitemapEntry[],
  publicationName = SITE_NAME,
  language = SITE_LANGUAGE,
): string {
  const body = entries
    .map(
      (e) =>
        `<url><loc>${escapeXml(e.loc)}</loc><news:news><news:publication><news:name>${escapeXml(
          publicationName,
        )}</news:name><news:language>${escapeXml(language)}</news:language></news:publication>` +
        `<news:publication_date>${e.publishedAt.toISOString()}</news:publication_date>` +
        `<news:title>${escapeXml(e.title)}</news:title></news:news></url>`,
    )
    .join("\n")
  return (
    `${XML_DECL}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
    `xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${body}\n</urlset>\n`
  )
}

export type RssItem = {
  title: string
  link: string
  description: string
  pubDate: Date
  category?: string
  imageUrl?: string | null
}

function imageMime(url: string): string {
  const ext = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase()
  switch (ext) {
    case "png":
      return "image/png"
    case "webp":
      return "image/webp"
    case "gif":
      return "image/gif"
    case "avif":
      return "image/avif"
    default:
      return "image/jpeg"
  }
}

export function buildRssXml(opts: {
  title: string
  link: string
  description: string
  selfUrl: string
  language?: string
  items: RssItem[]
}): string {
  const items = opts.items
    .map((it) => {
      let x =
        `<item><title>${escapeXml(it.title)}</title><link>${escapeXml(it.link)}</link>` +
        `<guid isPermaLink="true">${escapeXml(it.link)}</guid>` +
        `<pubDate>${it.pubDate.toUTCString()}</pubDate>` +
        `<description>${escapeXml(it.description)}</description>`
      if (it.category) x += `<category>${escapeXml(it.category)}</category>`
      if (it.imageUrl) {
        x += `<enclosure url="${escapeXml(it.imageUrl)}" length="0" type="${imageMime(it.imageUrl)}"/>`
      }
      return `${x}</item>`
    })
    .join("\n")
  const last = opts.items[0]?.pubDate ?? new Date(0)
  return (
    `${XML_DECL}<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n` +
    `<title>${escapeXml(opts.title)}</title><link>${escapeXml(opts.link)}</link>` +
    `<description>${escapeXml(opts.description)}</description>` +
    `<language>${escapeXml(opts.language ?? SITE_LANGUAGE)}</language>` +
    `<lastBuildDate>${last.toUTCString()}</lastBuildDate>` +
    `<atom:link href="${escapeXml(opts.selfUrl)}" rel="self" type="application/rss+xml"/>\n` +
    `${items}\n</channel></rss>\n`
  )
}

export const FEED_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600"
