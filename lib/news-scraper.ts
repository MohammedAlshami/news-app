export type ScraperSourceKey = "rt" | "independent"

export type ScrapedNewsItem = {
  title: string
  url: string
  excerpt: string
  content?: string
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

function htmlToTiptapJson(html: string): string {
  // Parse HTML content into Tiptap JSON structure with proper block-level elements
  const content: Array<{
    type: string
    content?: Array<{ type: string; text?: string; marks?: Array<{ type: string }> }>
    attrs?: Record<string, unknown>
  }> = []

  // Remove script and style tags
  let cleanHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  cleanHtml = cleanHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
  
  // Extract all block-level elements (p, h1-h6, ul, ol, blockquote, etc.)
  // We'll process them in order
  const blockRegex = /<(p|h[1-6]|ul|ol|blockquote|div)[^>]*>([\s\S]*?)<\/\1>/gi
  let match: RegExpExecArray | null
  const blocks: Array<{ tag: string; content: string }> = []
  
  while ((match = blockRegex.exec(cleanHtml)) !== null) {
    blocks.push({ tag: match[1].toLowerCase(), content: match[2] })
  }
  
  // If no blocks found, treat entire content as paragraphs split by <br>
  if (blocks.length === 0) {
    const lines = cleanHtml.split(/<br\s*\/?>/gi)
    for (const line of lines) {
      const text = cleanText(line)
      if (text) {
        content.push({
          type: "paragraph",
          content: [{ type: "text", text }],
        })
      }
    }
  } else {
    // Process each block
    for (const block of blocks) {
      const { tag, content: blockContent } = block
      
      // Handle headings
      if (tag.startsWith("h")) {
        const level = parseInt(tag[1], 10)
        const text = cleanText(blockContent)
        if (text) {
          content.push({
            type: "heading",
            attrs: { level: Math.min(Math.max(level, 1), 6) },
            content: [{ type: "text", text }],
          })
        }
        continue
      }
      
      // Handle lists
      if (tag === "ul" || tag === "ol") {
        const listItems: Array<{ type: string; content: Array<{ type: string; content: Array<{ type: string; text: string }> }> }> = []
        const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
        let liMatch: RegExpExecArray | null
        
        while ((liMatch = liRegex.exec(blockContent)) !== null) {
          const text = cleanText(liMatch[1])
          if (text) {
            listItems.push({
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text }],
                },
              ],
            })
          }
        }
        
        if (listItems.length > 0) {
          content.push({
            type: tag === "ul" ? "bulletList" : "orderedList",
            content: listItems,
          })
        }
        continue
      }
      
      // Handle blockquotes
      if (tag === "blockquote") {
        const text = cleanText(blockContent)
        if (text) {
          content.push({
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text }],
              },
            ],
          })
        }
        continue
      }
      
      // Handle paragraphs and divs
      if (tag === "p" || tag === "div") {
        // Check for inline formatting (bold, italic, links)
        const textNodes = parseInlineFormatting(blockContent)
        if (textNodes.length > 0) {
          content.push({
            type: "paragraph",
            content: textNodes,
          })
        }
      }
    }
  }

  return JSON.stringify({
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
  })
}

function parseInlineFormatting(html: string): Array<{ type: string; text: string; marks?: Array<{ type: string }> }> {
  // Parse inline formatting like bold, italic, links
  const nodes: Array<{ type: string; text: string; marks?: Array<{ type: string }> }> = []
  
  // Simple approach: extract text and check for formatting tags
  // This is a simplified parser - for production, consider using a proper HTML parser
  
  // Remove all tags and get plain text first
  const plainText = cleanText(html)
  if (!plainText) return []
  
  // Check if there are any formatting tags
  const hasBold = /<(?:strong|b)\b[^>]*>/i.test(html)
  const hasItalic = /<(?:em|i)\b[^>]*>/i.test(html)
  const hasLink = /<a\b[^>]*>/i.test(html)
  
  // If no formatting, return plain text
  if (!hasBold && !hasItalic && !hasLink) {
    return [{ type: "text", text: plainText }]
  }
  
  // For now, if there's formatting, we'll apply it to the whole text
  // A more sophisticated parser would track positions
  const marks: Array<{ type: string; attrs?: Record<string, unknown> }> = []
  
  if (hasBold) marks.push({ type: "bold" })
  if (hasItalic) marks.push({ type: "italic" })
  
  if (hasLink) {
    const linkMatch = html.match(/<a\b[^>]*href="([^"]+)"[^>]*>/i)
    if (linkMatch) {
      marks.push({ type: "link", attrs: { href: linkMatch[1] } })
    }
  }
  
  return [{ type: "text", text: plainText, marks: marks.length > 0 ? marks : undefined }]
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

async function fetchRtArticleContent(url: string): Promise<string> {
  try {
    const html = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar,en;q=0.9",
      }
    }).then((r) => r.text())
    
    // Try multiple selectors for RT Arabic content
    let content = ""
    
    // Try article__text class
    let match = html.match(/<div\b[^>]*class="[^"]*\barticle__text\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    if (match) content = match[1]
    
    // Try article__summary if article__text not found
    if (!content) {
      match = html.match(/<div\b[^>]*class="[^"]*\barticle__summary\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      if (match) content = match[1]
    }
    
    // Try article-content class
    if (!content) {
      match = html.match(/<div\b[^>]*class="[^"]*\barticle-content\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      if (match) content = match[1]
    }
    
    if (!content) return ""
    
    // Clean up but preserve paragraph structure
    content = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    content = content.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    
    // Convert to Tiptap JSON
    return htmlToTiptapJson(content)
  } catch {
    return ""
  }
}

async function fetchIndependentArticleContent(url: string): Promise<string> {
  try {
    const html = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar,en;q=0.9",
      }
    }).then((r) => r.text())
    
    // Try multiple selectors for Independent Arabia content
    let content = ""
    
    // Try field--name-body class
    let match = html.match(/<div\b[^>]*class="[^"]*\bfield--name-body\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    if (match) content = match[1]
    
    // Try article-body class
    if (!content) {
      match = html.match(/<div\b[^>]*class="[^"]*\barticle-body\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      if (match) content = match[1]
    }
    
    // Try field-item class
    if (!content) {
      match = html.match(/<div\b[^>]*class="[^"]*\bfield-item\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      if (match) content = match[1]
    }
    
    if (!content) return ""
    
    // Clean up but preserve paragraph structure
    content = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    content = content.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    
    // Convert to Tiptap JSON
    return htmlToTiptapJson(content)
  } catch {
    return ""
  }
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
    
    // Fetch content for each article (limit to first 5 to avoid too many requests)
    const itemsWithContent = await Promise.all(
      items.slice(0, 5).map(async (item) => {
        const content = this.source === "rt" 
          ? await fetchRtArticleContent(item.url)
          : await fetchIndependentArticleContent(item.url)
        return { ...item, content }
      })
    )
    
    return {
      sourceKey: this.source,
      source: this.source.toUpperCase(),
      category: category || this.defaultCategory,
      query: query || undefined,
      items: itemsWithContent,
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
