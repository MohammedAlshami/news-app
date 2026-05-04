export type ScraperSourceKey = "rt" | "independent"

export type ScrapedNewsItem = {
  title: string
  url: string
  excerpt: string
  imageUrl?: string
  publishedAt?: string
  rawJson: unknown
}

export type ScrapeResult = {
  sourceKey: ScraperSourceKey
  source: string
  category: string
  query?: string
  items: ScrapedNewsItem[]
  sourcePage: string
}

type SourceConfig = {
  searchUrl: (query: string) => string
  categoryUrl: (category: string) => string | null
  supportedCategories: Record<string, string>
  searchHeaders?: HeadersInit
  categoryHeaders?: HeadersInit
  parse: (html: string) => ScrapedNewsItem[]
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function cleanText(value: string): string {
  return decodeBasicEntities(stripTags(value)).trim()
}

function normalizeUrl(input: string, base: string): string {
  try {
    return new URL(input, base).toString()
  } catch {
    return input
  }
}

function firstMatch(block: string, re: RegExp): string {
  const m = block.match(re)
  return m?.[1] ? m[1] : ""
}

function parseCardsBySelector(
  html: string,
  selector: RegExp,
  extract: (block: string) => ScrapedNewsItem | null,
): ScrapedNewsItem[] {
  const items: ScrapedNewsItem[] = []
  let m: RegExpExecArray | null
  while ((m = selector.exec(html)) !== null) {
    const item = extract(m[1])
    if (item) items.push(item)
  }
  return items
}

function parseRt(html: string): ScrapedNewsItem[] {
  return parseCardsBySelector(
    html,
    /<article\b[^>]*class="[^"]*\bmain-article\b[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
    (block) => {
      const title = cleanText(
        firstMatch(
          block,
          /<h3\b[^>]*class="[^"]*\bmain-article__title\b[^"]*"[^>]*>[\s\S]*?<a\b[^>]*href="[^"]+"[^>]*>([\s\S]*?)<\/a>/i,
        ),
      )
      const link = firstMatch(
        block,
        /<h3\b[^>]*class="[^"]*\bmain-article__title\b[^"]*"[^>]*>[\s\S]*?<a\b[^>]*href="([^"]+)"/i,
      )
      const excerpt = cleanText(
        firstMatch(
          block,
          /<p\b[^>]*class="[^"]*\bmain-article__summary\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
        ),
      )
      const publishedAt = cleanText(firstMatch(block, /<time\b[^>]*datetime="([^"]+)"/i))
      const imageUrl =
        firstMatch(block, /<img\b[^>]*data-src="([^"]+)"/i) ||
        firstMatch(block, /<img\b[^>]*src="([^"]+)"/i)
      if (!title || !link) return null
      return {
        title,
        url: normalizeUrl(link, "https://arabic.rt.com"),
        excerpt,
        publishedAt,
        imageUrl: imageUrl ? normalizeUrl(imageUrl, "https://arabic.rt.com") : undefined,
        rawJson: { title, link, excerpt, publishedAt, imageUrl },
      }
    },
  )
}

function parseIndependent(html: string): ScrapedNewsItem[] {
  const urls = [...html.matchAll(/"url"\s*:\s*"(https:\/\/www\.independentarabia\.com\/node\/[^"]+)"/g)].map(
    (m) => m[1],
  )
  return urls.slice(0, 20).map((url) => {
    const slug = decodeURIComponent(url.split("/").pop() ?? url)
    return {
      title: cleanText(slug.replace(/-/g, " ")),
      url,
      excerpt: "",
      rawJson: { url, slug },
    }
  })
}

const SOURCES: Record<ScraperSourceKey, SourceConfig> = {
  rt: {
    searchUrl: (query) => `https://arabic.rt.com/search/?q=${encodeURIComponent(query)}`,
    categoryUrl: (category) => {
      const map: Record<string, string> = {
        business: "https://arabic.rt.com/business/",
        docfilms: "https://arabic.rt.com/docfilms/",
        features: "https://arabic.rt.com/features/",
        guide: "https://arabic.rt.com/guide/",
        middle_east: "https://arabic.rt.com/middle_east/",
        news: "https://arabic.rt.com/news/",
        press: "https://arabic.rt.com/press/",
        prg: "https://arabic.rt.com/prg/",
        russia: "https://arabic.rt.com/russia/",
        satelites: "https://arabic.rt.com/satelites/",
        sport: "https://arabic.rt.com/sport/",
        world: "https://arabic.rt.com/world/",
      }
      return map[category] ?? null
    },
    supportedCategories: {
      business: "https://arabic.rt.com/business/",
      docfilms: "https://arabic.rt.com/docfilms/",
      features: "https://arabic.rt.com/features/",
      guide: "https://arabic.rt.com/guide/",
      middle_east: "https://arabic.rt.com/middle_east/",
      news: "https://arabic.rt.com/news/",
      press: "https://arabic.rt.com/press/",
      prg: "https://arabic.rt.com/prg/",
      russia: "https://arabic.rt.com/russia/",
      satelites: "https://arabic.rt.com/satelites/",
      sport: "https://arabic.rt.com/sport/",
      world: "https://arabic.rt.com/world/",
    },
    parse: parseRt,
  },
  independent: {
    searchUrl: (query) => `https://www.independentarabia.com/search/content?keys=${encodeURIComponent(query)}`,
    categoryUrl: (category) => {
      const map: Record<string, string> = {
        arts: "https://www.independentarabia.com/فنون",
        culture: "https://www.independentarabia.com/ثقافة",
        economy: "https://www.independentarabia.com/اقتصاد",
        environment: "https://www.independentarabia.com/بيئة",
        health: "https://www.independentarabia.com/صحة",
        middle_east: "https://www.independentarabia.com/الأخبار/الشرق-الأوسط",
        news: "https://www.independentarabia.com/الأخبار",
        politics: "https://www.independentarabia.com/سياسة",
        science: "https://www.independentarabia.com/علوم",
        sport: "https://www.independentarabia.com/رياضة",
        varieties: "https://www.independentarabia.com/منوعات",
        world: "https://www.independentarabia.com/الأخبار/العالم-العربي",
      }
      return map[category] ?? null
    },
    supportedCategories: {
      arts: "https://www.independentarabia.com/فنون",
      culture: "https://www.independentarabia.com/ثقافة",
      economy: "https://www.independentarabia.com/اقتصاد",
      environment: "https://www.independentarabia.com/بيئة",
      health: "https://www.independentarabia.com/صحة",
      middle_east: "https://www.independentarabia.com/الأخبار/الشرق-الأوسط",
      news: "https://www.independentarabia.com/الأخبار",
      politics: "https://www.independentarabia.com/سياسة",
      science: "https://www.independentarabia.com/علوم",
      sport: "https://www.independentarabia.com/رياضة",
      varieties: "https://www.independentarabia.com/منوعات",
      world: "https://www.independentarabia.com/الأخبار/العالم-العربي",
    },
    searchHeaders: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "news-worker/3.0 (Independent Arabia frontend scraper)",
      "accept-language": "ar,en;q=0.8",
    },
    parse: parseIndependent,
  },
}

export class NewsScraper {
  private readonly source: ScraperSourceKey

  constructor(source: ScraperSourceKey) {
    this.source = source
  }

  get supportedCategories(): Record<string, string> {
    return SOURCES[this.source].supportedCategories
  }

  get defaultCategory(): string {
    return this.source === "rt" ? "world" : "news"
  }

  resolveUrl(query: string, category: string): string {
    const cfg = SOURCES[this.source]
    if (category) {
      return cfg.categoryUrl(category) ?? cfg.categoryUrl(this.defaultCategory) ?? cfg.searchUrl(query)
    }
    return cfg.searchUrl(query)
  }

  async scrape(input: { query?: string; category?: string }): Promise<ScrapeResult> {
    const cfg = SOURCES[this.source]
    const query = (input.query ?? "").trim()
    const category = (input.category ?? "").trim().toLowerCase()
    const url = this.resolveUrl(query, category)
    const headers = category ? cfg.categoryHeaders ?? cfg.searchHeaders : cfg.searchHeaders
    const html = await fetch(url, { headers }).then(async (res) => {
      const text = await res.text()
      if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${text.slice(0, 200)}`)
      return text
    })
    const items = cfg.parse(html)
    return {
      sourceKey: this.source,
      source: this.source.toUpperCase(),
      category: category || this.defaultCategory,
      query: query || undefined,
      items,
      sourcePage: url,
    }
  }
}

export function createNewsScraper(source: ScraperSourceKey) {
  return new NewsScraper(source)
}

export function getSupportedCategories(source: ScraperSourceKey): string[] {
  return Object.keys(SOURCES[source].supportedCategories).sort()
}
