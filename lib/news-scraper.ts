export type ScraperSourceKey = "rt" | "independent" | "skynews" | "youm7" | "bbc" | "alaraby" | "elwatan" | "alquds" | "shabiba" | "addustour" | "alhurra" | "aawsat"

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

type TiptapNode = {
  type: string
  content?: TiptapNode[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, any> }>
  attrs?: Record<string, any>
}

function htmlToTiptapJson(html: string): string {
  // Parse HTML content into Tiptap JSON structure with proper block-level elements
  const content: TiptapNode[] = []

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
        const listItems: TiptapNode[] = []
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

function parseInlineFormatting(html: string): TiptapNode[] {
  // Parse inline formatting like bold, italic, links
  const nodes: TiptapNode[] = []
  
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
  // Build a map of URL -> publishedAt from JSON-LD ItemList
  const ldPubMap = new Map<string, string>()
  const ldScript = html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)
  if (ldScript) {
    try {
      const parsed = JSON.parse(ldScript[1])
      const list = parsed?.itemListElement ?? parsed?.["@graph"]?.find((g: any) => g?.itemListElement)?.itemListElement
      if (Array.isArray(list)) {
        for (const entry of list) {
          const url = entry?.url ?? entry?.["@id"]
          if (url && entry?.datePublished) ldPubMap.set(normalizeUrl(url, "https://arabic.rt.com"), entry.datePublished)
        }
      }
    } catch {}
  }

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
      let publishedAt = cleanText(firstMatch(block, /<time\b[^>]*datetime="([^"]+)"/i))
      if (!publishedAt && link) {
        const normalizedLink = normalizeUrl(link, "https://arabic.rt.com")
        publishedAt = ldPubMap.get(normalizedLink) ?? ""
      }
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
  // Parse JSON-LD ItemList for full article data including images
  const jsonLdMatch = html.match(
    /<script type="application\/ld\+json">[\s\S]*?"@type"\s*:\s*"ItemList"[\s\S]*?<\/script>/i,
  )

  // Parse headline news section for large hero articles
  const headlineCards: ScrapedNewsItem[] = []
  const headlineRegex = /<a\b[^>]*class="[^"]*\bcard-hero__link\b[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = headlineRegex.exec(html)) !== null) {
    const url = m[1].startsWith("http") ? m[1] : `https://www.independentarabia.com${m[1]}`
    const titleMatch = m[2].match(/<h2\b[^>]*class="[^"]*\bcard-hero__title\b[^"]*"[^>]*>([\s\S]*?)<\/h2>/i)
    const imgMatch = m[2].match(/<img\b[^>]*src="([^"]+)"/i)
    headlineCards.push({
      title: titleMatch ? cleanText(titleMatch[1]) : "",
      url,
      excerpt: "",
      imageUrl: imgMatch ? imgMatch[1] : undefined,
      rawJson: { source: "headline" },
    })
  }

  // Parse normal article cards from JSON-LD
  const urls: string[] = []
  const urlRegex = /"url"\s*:\s*"(https:\/\/www\.independentarabia\.com\/node\/[^"]+)"/g
  while ((m = urlRegex.exec(html)) !== null) {
    urls.push(m[1])
  }

  // Also try parsing standard article cards
  const cardRegex = /<article\b[^>]*class="[^"]*\bcard\b[^"]*"[^>]*>([\s\S]*?)<\/article>/gi
  const cardItems: ScrapedNewsItem[] = []
  while ((m = cardRegex.exec(html)) !== null) {
    const card = m[1]
    const linkMatch = card.match(/<a\b[^>]*href="([^"]+)"/i)
    const titleMatch = card.match(/<h3\b[^>]*class="[^"]*\bcard__title\b[^"]*"[^>]*>([\s\S]*?)<\/h3>/i)
    const imgMatch = card.match(/<img\b[^>]*src="([^"]+)"/i)
    if (linkMatch && titleMatch) {
      const url = linkMatch[1].startsWith("http") ? linkMatch[1] : `https://www.independentarabia.com${linkMatch[1]}`
      cardItems.push({
        title: cleanText(titleMatch[1]),
        url,
        excerpt: "",
        imageUrl: imgMatch ? imgMatch[1] : undefined,
        rawJson: { source: "card" },
      })
    }
  }

  const items = [...headlineCards, ...cardItems]

  // Also add URLs from JSON-LD that weren't found in the cards
  const foundUrls = new Set(items.map(i => i.url))
  for (const u of urls) {
    if (!foundUrls.has(u)) {
      const slug = decodeURIComponent(u.split("/").pop() ?? u)
      items.push({
        title: cleanText(slug.replace(/-/g, " ")),
        url: u,
        excerpt: "",
        rawJson: { url: u, slug },
      })
    }
  }

  return items.slice(0, 20)
}

async function fetchRtArticleContent(url: string): Promise<{ excerpt: string; imageUrl: string; publishedAt: string; content: string }> {
  const html = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "ar,en;q=0.9",
    }
  }).then((r) => r.text())

  let imageUrl = ""
  let publishedAt = ""

  // Extract imageUrl from JSON-LD or OG meta
  const ldMatch = html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)
  if (ldMatch) {
    try {
      const parsed = JSON.parse(ldMatch[1])
      const article = Array.isArray(parsed?.["@graph"])
        ? parsed["@graph"].find((g: any) => g?.["@type"]?.includes?.("NewsArticle"))
        : parsed
      if (article?.datePublished) publishedAt = article.datePublished
      if (article?.image?.url) imageUrl = article.image.url
      else if (article?.image && typeof article.image === "string") imageUrl = article.image
    } catch {}
  }
  if (!imageUrl) {
    const ogImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    if (ogImage) imageUrl = ogImage[1]
  }

  // Extract publishedAt — try multiple strategies
  if (!publishedAt) {
    const timeMatch = html.match(/<time\b[^>]*datetime="([^"]+)"/i)
    if (timeMatch) publishedAt = timeMatch[1]
  }
  if (!publishedAt) {
    const ptMatch = html.match(/<meta\b[^>]*property="article:published_time"[^>]*content="([^"]+)"/i)
    if (ptMatch) publishedAt = ptMatch[1]
  }
  if (!publishedAt) {
    const metaMatch = html.match(/<meta\b[^>]*name="(?:pubdate|publishdate|dc\.date\w*)"[^>]*content="([^"]+)"/i)
    if (metaMatch) publishedAt = metaMatch[1]
  }
  if (!publishedAt) {
    const itemMatch = html.match(/itemprop="datePublished"[^>]*content="([^"]+)"/i)
    if (itemMatch) publishedAt = itemMatch[1]
  }

  // Extract excerpt
  let excerpt = ""
  const introBlock = html.match(/<div\b[^>]*class="[^"]*\bmain-article__intro-text\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
  if (introBlock) {
    const summaryP = introBlock[1].match(/<p\b[^>]*class="[^"]*\bmain-article__summary\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
    if (summaryP) excerpt = cleanText(summaryP[1])
  }
  if (!excerpt) {
    const summaryDiv = html.match(/<p\b[^>]*class="[^"]*\bmain-article__summary\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
    if (summaryDiv) excerpt = cleanText(summaryDiv[1])
  }

  // Extract body
  const editorMatch = html.match(/<div\b[^>]*class="[^"]*\beditor-content\b[^"]*"[^>]*>([\s\S]+)/i)
  if (!editorMatch) return { excerpt, imageUrl, publishedAt, content: "" }

  let contentHtml = editorMatch[1]
  const cutoff = contentHtml.search(/<div\b[^>]*class="[^"]*\bmain-article__block--tags\b[^"]*"/i)
  if (cutoff > 0) contentHtml = contentHtml.slice(0, cutoff)

  contentHtml = contentHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  contentHtml = contentHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")

  return { excerpt, imageUrl, publishedAt, content: htmlToTiptapJson(contentHtml) }
}

async function fetchIndependentArticleContent(url: string): Promise<{ title: string; excerpt: string; imageUrl: string; publishedAt: string; content: string }> {
  try {
    const html = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar,en;q=0.9",
      }
    }).then((r) => r.text())

    let title = ""
    let excerpt = ""
    let imageUrl = ""
    let publishedAt = ""

    // Extract from JSON-LD first
    const ldMatch = html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)
    if (ldMatch) {
      try {
        const parsed = JSON.parse(ldMatch[1])
        const article = Array.isArray(parsed?.["@graph"])
          ? parsed["@graph"].find((g: any) => g?.["@type"]?.includes?.("NewsArticle"))
          : parsed
        if (article?.headline) title = cleanText(article.headline)
        if (article?.description) excerpt = cleanText(article.description)
        if (article?.datePublished) publishedAt = article.datePublished
        if (article?.image?.url) imageUrl = article.image.url
        else if (article?.image && typeof article.image === "string") imageUrl = article.image
      } catch {}
    }

    // Fallback to meta tags
    if (!title) {
      const ogTitle = html.match(/<meta\b[^>]*property="og:title"[^>]*content="([^"]+)"/i)
      if (ogTitle) title = cleanText(ogTitle[1])
    }
    if (!excerpt) {
      const metaDesc = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/i)
      if (metaDesc) excerpt = cleanText(metaDesc[1])
    }
    if (!publishedAt) {
      const ptMatch = html.match(/<meta\b[^>]*property="article:published_time"[^>]*content="([^"]+)"/i)
      if (ptMatch) publishedAt = ptMatch[1]
    }
    if (!imageUrl) {
      const ogImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)
      if (ogImage) imageUrl = ogImage[1]
    }
    
    // Extract article body
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
    
    if (content) {
      content = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      content = content.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      content = htmlToTiptapJson(content)
    }
    
    return { title, excerpt, imageUrl, publishedAt, content }
  } catch {
    return { title: "", excerpt: "", imageUrl: "", publishedAt: "", content: "" }
  }
}

function parseSkynews(html: string): ScrapedNewsItem[] {
  // Parse JSON-LD ItemList from skynewsarabia.com pages
  const jsonLdMatch = html.match(
    /<script type="application\/ld\+json">[\s\S]*?"@type"\s*:\s*"ItemList"[\s\S]*?<\/script>/i,
  )
  if (!jsonLdMatch) return []

  const urls: string[] = []
  const urlRegex = /"url"\s*:\s*"(https:\/\/www\.skynewsarabia\.com\/[^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = urlRegex.exec(jsonLdMatch[0])) !== null) {
    urls.push(m[1])
  }

  return urls.slice(0, 20).map((url) => {
    // Extract category from URL: /{category}/{id}-{slug}
    const pathParts = url.replace("https://www.skynewsarabia.com/", "").split("/")
    const category = pathParts[0] ?? ""
    // Derive a title from the slug
    const slug = pathParts.slice(1).join("/") || ""
    const title = cleanText(decodeURIComponent(slug).replace(/-/g, " ").replace(/\d+/g, "").trim()) || category
    return {
      title,
      url,
      excerpt: "",
      rawJson: { url, category, slug },
    }
  })
}

function parseYoum7(html: string): ScrapedNewsItem[] {
  const scriptMatch = html.match(/<\s*script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)
  if (!scriptMatch) return []
  try {
    const parsed = JSON.parse(scriptMatch[1])
    let list = parsed?.mainEntity?.itemListElement
    if (!list && Array.isArray(parsed?.["@graph"])) {
      for (const item of parsed["@graph"]) {
        if (item?.mainEntity?.itemListElement) {
          list = item.mainEntity.itemListElement
          break
        }
        if (item?.itemListElement) {
          list = item.itemListElement
          break
        }
      }
    }
    if (!Array.isArray(list)) return []
    return list
      .filter((el: any) => el?.url && el?.name)
      .map((el: any) => ({
        title: cleanText(el.name),
        url: el.url,
        excerpt: "",
        rawJson: { position: el.position, url: el.url, name: el.name },
      }))
  } catch {
    return []
  }
}

function parseBbc(html: string): ScrapedNewsItem[] {
  const items: ScrapedNewsItem[] = []
  const seen = new Set<string>()
  // Extract from h2/h3 elements containing article links
  const blockRegex = /<h[23][^>]*>[\s\S]*?<a\b[^>]*href="(https:\/\/www\.bbc\.com\/arabic\/articles\/[^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h[23]>/gi
  let m: RegExpExecArray | null
  while ((m = blockRegex.exec(html)) !== null) {
    const url = m[1]
    if (seen.has(url)) continue
    seen.add(url)
    const title = cleanText(m[2])
    if (!title) continue
    items.push({ title, url, excerpt: "", rawJson: { url } })
  }
  return items
}

function parseElwatan(html: string): ScrapedNewsItem[] {
  const items: ScrapedNewsItem[] = []
  const articleRegex = /<a\b[^>]*href="\/news\/details\/(\d+)"[^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  const seen = new Set<string>()
  while ((m = articleRegex.exec(html)) !== null) {
    const id = m[1]
    if (seen.has(id)) continue
    seen.add(id)
    const title = cleanText(m[2])
    if (!title) continue
    const url = `https://www.elwatannews.com/news/details/${id}`
    items.push({ title, url, excerpt: "", rawJson: { id, title } })
  }
  return items
}

async function fetchElwatanArticleContent(url: string): Promise<{ title: string; excerpt: string; imageUrl: string; publishedAt: string; content: string }> {
  try {
    const html = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar,en;q=0.9",
      }
    }).then((r) => r.text())

    let title = ""
    let excerpt = ""
    let imageUrl = ""
    let publishedAt = ""

    const ogTitle = html.match(/<meta\b[^>]*property="og:title"[^>]*content="([^"]+)"/i)
    if (ogTitle) title = cleanText(ogTitle[1])
    if (!title) {
      const titleTag = html.match(/<title>([\s\S]*?)<\/title>/i)
      if (titleTag) title = cleanText(titleTag[1])
    }

    const metaDesc = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/i)
    if (metaDesc) excerpt = cleanText(metaDesc[1])

    const ogImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    if (ogImage) imageUrl = ogImage[1]

    const pubDate = html.match(/<meta\b[^>]*property="article:published_time"[^>]*content="([^"]+)"/i)
    if (pubDate) publishedAt = pubDate[1]

    let content = ""
    let bodyMatch = html.match(/<div\b[^>]*class="[^"]*\bcontent-text-wrapper\b[^"]*"[^>]*>([\s\S]*?)(?:<div\b[^>]*id="taboola|<ul\b[^>]*class="row\b)/i)
    if (!bodyMatch) {
      bodyMatch = html.match(/<div\b[^>]*class="[^"]*\b(?:article-body|article-content|story-body|news-body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    }
    if (bodyMatch) {
      let bodyHtml = bodyMatch[1]
      bodyHtml = bodyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      bodyHtml = bodyHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      content = htmlToTiptapJson(bodyHtml)
    }

    return { title, excerpt, imageUrl, publishedAt, content }
  } catch {
    return { title: "", excerpt: "", imageUrl: "", publishedAt: "", content: "" }
  }
}

async function fetchSkynewsArticleContent(url: string): Promise<{ title: string; excerpt: string; imageUrl: string; publishedAt: string; content: string }> {
  try {
    // Fetch AMP version which has server-rendered content
    const ampUrl = url.replace("https://www.skynewsarabia.com", "https://www.skynewsarabia.com/amp")
    const html = await fetch(ampUrl, {
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar,en;q=0.9",
      }
    }).then((r) => r.text())

    // Extract from JSON-LD
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">[\s\S]*?"@type"\s*:\s*"NewsArticle"[\s\S]*?<\/script>/i)
    let title = ""
    let excerpt = ""
    let imageUrl = ""
    let publishedAt = ""

    if (jsonLdMatch) {
      const ld = jsonLdMatch[0]
      const tMatch = ld.match(/"headline"\s*:\s*"([^"]+)"/)
      if (tMatch) title = cleanText(tMatch[1])
      const dMatch = ld.match(/"description"\s*:\s*"([^"]+)"/)
      if (dMatch) excerpt = cleanText(dMatch[1])
      const iMatch = ld.match(/"image"\s*:\s*\{[^}]*"url"\s*:\s*"([^"]+)"/)
      if (iMatch) imageUrl = iMatch[1]
      const pMatch = ld.match(/"datePublished"\s*:\s*"([^"]+)"/)
      if (pMatch) publishedAt = pMatch[1]
    }

    // Fallback to meta tags
    if (!title) {
      const ogTitle = html.match(/<meta\b[^>]*property="og:title"[^>]*content="([^"]+)"/i)
      if (ogTitle) title = cleanText(ogTitle[1])
    }
    if (!excerpt) {
      const metaDesc = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/i)
      if (metaDesc) excerpt = cleanText(metaDesc[1])
    }
    if (!imageUrl) {
      const ogImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)
      if (ogImage) imageUrl = ogImage[1]
    }

    // Extract body from article-description div
    const bodyMatch = html.match(/<div\b[^>]*class="[^"]*\barticle-description\b[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i)
    let content = ""
    if (bodyMatch) {
      let bodyHtml = bodyMatch[1]
      bodyHtml = bodyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      bodyHtml = bodyHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      bodyHtml = bodyHtml.replace(/<amp-[^>]+>[\s\S]*?<\/amp-[^>]+>/gi, "")
      bodyHtml = bodyHtml.replace(/<amp-[^/][^>]*\/>/gi, "")
      content = htmlToTiptapJson(bodyHtml)
    }

    return { title, excerpt, imageUrl, publishedAt, content }
  } catch {
    return { title: "", excerpt: "", imageUrl: "", publishedAt: "", content: "" }
  }
}

async function fetchYoum7ArticleContent(url: string): Promise<{ title: string; excerpt: string; imageUrl: string; publishedAt: string; content: string }> {
  try {
    const html = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar,en;q=0.9",
      }
    }).then((r) => r.text())

    let title = ""
    let excerpt = ""
    let imageUrl = ""
    let publishedAt = ""

    const scriptMatch = html.match(/<\s*script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)
    if (scriptMatch) {
      try {
        const parsed = JSON.parse(scriptMatch[1])
        if (parsed?.headline) title = cleanText(parsed.headline)
        if (parsed?.description) excerpt = cleanText(parsed.description)
        if (parsed?.datePublished) publishedAt = parsed.datePublished
        if (parsed?.image?.url) imageUrl = parsed.image.url
      } catch {}
    }

    if (!title) {
      const ogTitle = html.match(/<meta\b[^>]*property="og:title"[^>]*content="([^"]+)"/i)
      if (ogTitle) title = cleanText(ogTitle[1])
    }
    if (!excerpt) {
      const metaDesc = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/i)
      if (metaDesc) excerpt = cleanText(metaDesc[1])
    }
    if (!imageUrl) {
      const ogImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)
      if (ogImage) imageUrl = ogImage[1]
    }
    if (!publishedAt) {
      const ptMatch = html.match(/<meta\b[^>]*property="article:published_time"[^>]*content="([^"]+)"/i)
      if (ptMatch) publishedAt = ptMatch[1]
    }

    let content = ""
    const bodyMatch = html.match(/<div\b[^>]*id="articleBody"[^>]*>([\s\S]*?)<\/div>\s*<\/(?:div|article|section)/i)
    if (!bodyMatch) {
      // Fallback: try to match until next tag or end of parent
      const fallback = html.match(/<div\b[^>]*id="articleBody"[^>]*>([\s\S]*?)(?:<\/div>\s*<(?:br|div|script|aside))/i)
      if (fallback) {
        let bodyHtml = fallback[1]
        bodyHtml = bodyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        bodyHtml = bodyHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
        content = htmlToTiptapJson(bodyHtml)
      }
    } else {
      let bodyHtml = bodyMatch[1]
      bodyHtml = bodyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      bodyHtml = bodyHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      content = htmlToTiptapJson(bodyHtml)
    }

    return { title, excerpt, imageUrl, publishedAt, content }
  } catch {
    return { title: "", excerpt: "", imageUrl: "", publishedAt: "", content: "" }
  }
}

async function fetchBbcArticleContent(url: string): Promise<{ title: string; excerpt: string; imageUrl: string; publishedAt: string; content: string }> {
  try {
    const html = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar,en;q=0.9",
      }
    }).then((r) => r.text())

    let title = ""
    let excerpt = ""
    let imageUrl = ""
    let publishedAt = ""
    let content = ""

    const scriptMatch = html.match(/<\s*script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)
    if (scriptMatch) {
      try {
        const parsed = JSON.parse(scriptMatch[1])
        const article = Array.isArray(parsed?.["@graph"])
          ? parsed["@graph"].find((g: any) => g?.["@type"]?.includes?.("NewsArticle"))
          : parsed
        if (article?.headline) title = cleanText(article.headline)
        if (article?.description) excerpt = cleanText(article.description)
        if (article?.datePublished) publishedAt = article.datePublished
        if (article?.image?.url) imageUrl = article.image.url
      } catch {}
    }

    if (!title) {
      const ogTitle = html.match(/<meta\b[^>]*property="og:title"[^>]*content="([^"]+)"/i)
      if (ogTitle) title = cleanText(ogTitle[1])
    }
    if (!excerpt) {
      const metaDesc = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/i)
      if (metaDesc) excerpt = cleanText(metaDesc[1])
    }
    if (!imageUrl) {
      const ogImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)
      if (ogImage) imageUrl = ogImage[1]
    }

    // Try AMP version for content
    const ampUrl = url + ".amp"
    try {
      const ampHtml = await fetch(ampUrl, {
        cache: "no-store",
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": "ar,en;q=0.9",
        }
      }).then((r) => r.text())

      const bodyMatch = ampHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
      if (bodyMatch) {
        let bodyHtml = bodyMatch[1]
        bodyHtml = bodyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        bodyHtml = bodyHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
        const pContent = [...bodyHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
          .map(m => m[1])
          .join("")
        if (pContent) content = htmlToTiptapJson(`<div>${pContent}</div>`)
      }
    } catch {
      // Fallback: use excerpt as content
    }

    return { title, excerpt, imageUrl, publishedAt, content }
  } catch {
    return { title: "", excerpt: "", imageUrl: "", publishedAt: "", content: "" }
  }
}

function parseAlaraby(html: string): ScrapedNewsItem[] {
  const items: ScrapedNewsItem[] = []
  const seen = new Set<string>()
  // Extract from h2/h3 elements containing article links to content pages
  const blockRegex = /<h[23][^>]*>[\s\S]*?<a\b[^>]*href="(\/(?:politics|news|economy|sport|culture|society|opinion|investigations|entertainment_media)\/[^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h[23]>/gi
  let m: RegExpExecArray | null
  while ((m = blockRegex.exec(html)) !== null) {
    const link = m[1]
    const title = cleanText(m[2])
    if (!title || !link || seen.has(link)) continue
    seen.add(link)
    items.push({
      title,
      url: normalizeUrl(link, "https://www.aajeg.com"),
      excerpt: "",
      rawJson: { title, link },
    })
  }
  return items
}

async function fetchAlarabyArticleContent(url: string): Promise<{ title: string; excerpt: string; imageUrl: string; publishedAt: string; content: string }> {
  try {
    const html = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar,en;q=0.9",
      }
    }).then((r) => r.text())

    let title = ""
    let excerpt = ""
    let imageUrl = ""
    let publishedAt = ""

    const ogTitle = html.match(/<meta\b[^>]*property="og:title"[^>]*content="([^"]+)"/i)
    if (ogTitle) title = cleanText(ogTitle[1])
    if (!title) {
      const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
      if (h1) title = cleanText(h1[1])
    }

    const metaDesc = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/i)
    if (metaDesc) excerpt = cleanText(metaDesc[1])

    const ogImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    if (ogImage) imageUrl = ogImage[1]

    const publishedMatch = html.match(/<meta\b[^>]*property="article:published_time"[^>]*content="([^"]+)"/i)
    if (publishedMatch) { publishedAt = publishedMatch[1] }
    if (!publishedAt) {
      const ldScript = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)
      if (ldScript) {
        const dp = ldScript[1].match(/"datePublished"\s*:\s*"([^"]+)"/)
        if (dp) publishedAt = dp[1]
      }
    }

    let bodyHtml = ""
    const bodyMatch = html.match(/<div\b[^>]*class="[^"]*\bfield--name-body\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    if (bodyMatch) bodyHtml = bodyMatch[1]

    if (!bodyHtml) {
      const articleContent = html.match(/<div\b[^>]*class="[^"]*\barticle-content\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      if (articleContent) bodyHtml = articleContent[1]
    }

    if (!bodyHtml) {
      const mainContent = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
      if (mainContent) bodyHtml = mainContent[1]
    }

    if (bodyHtml) {
      bodyHtml = bodyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      bodyHtml = bodyHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    }

    const content = bodyHtml ? htmlToTiptapJson(bodyHtml) : ""

    return { title, excerpt, imageUrl, publishedAt, content }
  } catch {
    return { title: "", excerpt: "", imageUrl: "", publishedAt: "", content: "" }
  }
}

function parseAlquds(html: string): ScrapedNewsItem[] {
  const items: ScrapedNewsItem[] = []
  const seen = new Set<string>()
  const regex = /<a\b[^>]*href="\/ar\/posts\/(\d+)"[^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = regex.exec(html)) !== null) {
    const id = m[1]
    if (seen.has(id)) continue
    seen.add(id)
    const title = cleanText(m[2])
    if (!title) continue
    items.push({
      title,
      url: `https://www.alquds.com/ar/posts/${id}`,
      excerpt: "",
      rawJson: { id, title },
    })
  }
  return items
}

async function fetchAlqudsArticleContent(url: string): Promise<{ title: string; excerpt: string; imageUrl: string; publishedAt: string; content: string }> {
  try {
    const html = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar,en;q=0.9",
      }
    }).then((r) => r.text())

    let title = ""
    let excerpt = ""
    let imageUrl = ""
    let publishedAt = ""

    const ogTitle = html.match(/<meta\b[^>]*property="og:title"[^>]*content="([^"]+)"/i)
    if (ogTitle) title = cleanText(ogTitle[1])

    const metaDesc = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/i)
    if (metaDesc) excerpt = cleanText(metaDesc[1])

    const ogImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    if (ogImage) imageUrl = ogImage[1]

    const ptMatch = html.match(/<meta\b[^>]*property="article:published_time"[^>]*content="([^"]+)"/i)
    if (ptMatch) publishedAt = ptMatch[1]

    let bodyHtml = ""
    const bodyMatch = html.match(/<div\b[^>]*class="[^"]*\barticle-content\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    if (bodyMatch) bodyHtml = bodyMatch[1]

    if (!bodyHtml) {
      const proseMatch = html.match(/<div\b[^>]*class="[^"]*\bprose\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      if (proseMatch) bodyHtml = proseMatch[1]
    }

    if (bodyHtml) {
      bodyHtml = bodyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      bodyHtml = bodyHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    }

    const content = bodyHtml ? htmlToTiptapJson(bodyHtml) : ""

    return { title, excerpt, imageUrl, publishedAt, content }
  } catch {
    return { title: "", excerpt: "", imageUrl: "", publishedAt: "", content: "" }
  }
}

function parseAlhurra(html: string): ScrapedNewsItem[] {
  const items: ScrapedNewsItem[] = []
  const seen = new Set<string>()

  const numericLinkRegex = /<a\b[^>]*href="(https:\/\/alhurra\.com\/(\d+))"[^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = numericLinkRegex.exec(html)) !== null) {
    const url = m[1]
    const id = m[2]
    if (seen.has(id)) continue
    seen.add(id)
    const title = cleanText(m[3])
    if (!title) continue
    items.push({ title, url, excerpt: "", rawJson: { id, title } })
  }

  const hRegex = /<h[23][^>]*>[\s\S]*?<a\b[^>]*href="(https:\/\/alhurra\.com\/(\d+))"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h[23]>/gi
  while ((m = hRegex.exec(html)) !== null) {
    const url = m[1]
    const id = m[2]
    if (seen.has(id)) continue
    seen.add(id)
    const title = cleanText(m[3])
    if (!title) continue
    items.push({ title, url, excerpt: "", rawJson: { id, title } })
  }

  return items
}

async function fetchAlhurraArticleContent(url: string): Promise<{ title: string; excerpt: string; imageUrl: string; publishedAt: string; content: string }> {
  try {
    const html = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar,en;q=0.9",
      }
    }).then((r) => r.text())

    let title = ""
    let excerpt = ""
    let imageUrl = ""
    let publishedAt = ""

    const ogTitle = html.match(/<meta\b[^>]*property="og:title"[^>]*content="([^"]+)"/i)
    if (ogTitle) title = cleanText(ogTitle[1])

    const metaDesc = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/i)
    if (metaDesc) excerpt = cleanText(metaDesc[1])

    const ogImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    if (ogImage) imageUrl = ogImage[1]

    const ptMatch = html.match(/<meta\b[^>]*property="article:published_time"[^>]*content="([^"]+)"/i)
    if (ptMatch) publishedAt = ptMatch[1]

    let bodyHtml = ""
    const bodyMatch = html.match(/<div\b[^>]*class="[^"]*\b(?:entry-content|bt_bb_text|article-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    if (bodyMatch) bodyHtml = bodyMatch[1]

    if (!bodyHtml) {
      const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
      if (articleMatch) bodyHtml = articleMatch[1]
    }

    if (bodyHtml) {
      bodyHtml = bodyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      bodyHtml = bodyHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    }

    const content = bodyHtml ? htmlToTiptapJson(bodyHtml) : ""

    return { title, excerpt, imageUrl, publishedAt, content }
  } catch {
    return { title: "", excerpt: "", imageUrl: "", publishedAt: "", content: "" }
  }
}

function parseAawsat(html: string): ScrapedNewsItem[] {
  const items: ScrapedNewsItem[] = []
  const seen = new Set<string>()

  const hRegex = /<h[23][^>]*>[\s\S]*?<a\b[^>]*href="(https:\/\/aawsat\.com\/[^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h[23]>/gi
  let m: RegExpExecArray | null
  while ((m = hRegex.exec(html)) !== null) {
    const url = m[1]
    const title = cleanText(m[2])
    if (!title || !url || seen.has(url)) continue
    seen.add(url)
    items.push({ title, url, excerpt: "", rawJson: { title, url } })
  }

  const fieldRegex = /<div\b[^>]*class="[^"]*\bfield--name-node-title\b[^"]*"[^>]*>[\s\S]*?<a\b[^>]*href="(https:\/\/aawsat\.com\/[^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/div>/gi
  while ((m = fieldRegex.exec(html)) !== null) {
    const url = m[1]
    const title = cleanText(m[2])
    if (!title || !url || seen.has(url)) continue
    seen.add(url)
    items.push({ title, url, excerpt: "", rawJson: { title, url } })
  }

  const nodeLinkRegex = /<a\b[^>]*href="(https:\/\/aawsat\.com\/node\/(\d+))"[^>]*>([\s\S]*?)<\/a>/gi
  while ((m = nodeLinkRegex.exec(html)) !== null) {
    const url = m[1]
    const id = m[2]
    if (seen.has(url)) continue
    seen.add(url)
    const title = cleanText(m[3])
    if (!title) continue
    items.push({ title, url, excerpt: "", rawJson: { id, title, url } })
  }

  return items
}

async function fetchAawsatArticleContent(url: string): Promise<{ title: string; excerpt: string; imageUrl: string; publishedAt: string; content: string }> {
  try {
    const html = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar,en;q=0.9",
      }
    }).then((r) => r.text())

    let title = ""
    let excerpt = ""
    let imageUrl = ""
    let publishedAt = ""

    const ogTitle = html.match(/<meta\b[^>]*property="og:title"[^>]*content="([^"]+)"/i)
    if (ogTitle) title = cleanText(ogTitle[1])

    if (!title) {
      const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
      if (h1) title = cleanText(h1[1])
    }

    const metaDesc = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/i)
    if (metaDesc) excerpt = cleanText(metaDesc[1])

    const ogImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    if (ogImage) imageUrl = ogImage[1]

    const ptMatch = html.match(/<meta\b[^>]*property="article:published_time"[^>]*content="([^"]+)"/i)
    if (ptMatch) publishedAt = ptMatch[1]

    let bodyHtml = ""
    const bodyMatch = html.match(/<div\b[^>]*class="[^"]*\bfield--name-body\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    if (bodyMatch) bodyHtml = bodyMatch[1]

    if (!bodyHtml) {
      const contentMatch = html.match(/<div\b[^>]*class="[^"]*\b(?:article-content|content-body|node-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      if (contentMatch) bodyHtml = contentMatch[1]
    }

    if (!bodyHtml) {
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
      if (mainMatch) bodyHtml = mainMatch[1]
    }

    if (bodyHtml) {
      bodyHtml = bodyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      bodyHtml = bodyHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    }

    const content = bodyHtml ? htmlToTiptapJson(bodyHtml) : ""

    return { title, excerpt, imageUrl, publishedAt, content }
  } catch {
    return { title: "", excerpt: "", imageUrl: "", publishedAt: "", content: "" }
  }
}

function parseShabiba(html: string): ScrapedNewsItem[] {
  const items: ScrapedNewsItem[] = []
  const seen = new Set<string>()
  const articleRegex = /<article\b[^>]*class="[^"]*\bpost\b[^"]*"[^>]*>([\s\S]*?)<\/article>/gi
  let m: RegExpExecArray | null
  while ((m = articleRegex.exec(html)) !== null) {
    const block = m[1]
    const linkMatch = block.match(/<h3\b[^>]*class="[^"]*\bpost-title\b[^"]*"[^>]*>[\s\S]*?<a\b[^>]*href="(\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
    if (!linkMatch) continue
    const link = linkMatch[1]
    const title = cleanText(linkMatch[2])
    if (!title || seen.has(link)) continue
    seen.add(link)
    const imageUrl = firstMatch(block, /<img\b[^>]*src="([^"]+)"/i)
    items.push({
      title,
      url: normalizeUrl(link, "https://shabiba.com"),
      excerpt: "",
      imageUrl: imageUrl ? normalizeUrl(imageUrl, "https://shabiba.com") : undefined,
      rawJson: { link, title },
    })
  }
  return items
}

function parseAddustour(html: string): ScrapedNewsItem[] {
  const items: ScrapedNewsItem[] = []
  const seen = new Set<string>()
  const articleRegex = /<a\b[^>]*href="\/articles\/(\d+-[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = articleRegex.exec(html)) !== null) {
    const slug = m[1]
    if (seen.has(slug)) continue
    seen.add(slug)
    const title = cleanText(m[2])
    if (!title) continue
    items.push({
      title,
      url: `https://addustour.com/articles/${slug}`,
      excerpt: "",
      rawJson: { slug, title },
    })
  }
  return items
}

async function fetchShabibaArticleContent(url: string): Promise<{ title: string; excerpt: string; imageUrl: string; publishedAt: string; content: string }> {
  try {
    const html = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar,en;q=0.9",
      }
    }).then((r) => r.text())

    let title = ""
    let excerpt = ""
    let imageUrl = ""
    let publishedAt = ""

    const ogTitle = html.match(/<meta\b[^>]*property="og:title"[^>]*content="([^"]+)"/i)
    if (ogTitle) title = cleanText(ogTitle[1])
    if (!title) {
      const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
      if (h1) title = cleanText(h1[1])
    }

    const metaDesc = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/i)
    if (metaDesc) excerpt = cleanText(metaDesc[1])

    const ogImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    if (ogImage) imageUrl = ogImage[1]

    const ptMatch = html.match(/<meta\b[^>]*property="article:published_time"[^>]*content="([^"]+)"/i)
    if (ptMatch) publishedAt = ptMatch[1]

    let bodyHtml = ""
    const bodyMatch = html.match(/<div\b[^>]*class="[^"]*\barticle-body\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    if (bodyMatch) bodyHtml = bodyMatch[1]
    if (!bodyHtml) {
      const postBody = html.match(/<div\b[^>]*class="[^"]*\bpost-body\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      if (postBody) bodyHtml = postBody[1]
    }

    if (bodyHtml) {
      bodyHtml = bodyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      bodyHtml = bodyHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    }

    const content = bodyHtml ? htmlToTiptapJson(bodyHtml) : ""

    return { title, excerpt, imageUrl, publishedAt, content }
  } catch {
    return { title: "", excerpt: "", imageUrl: "", publishedAt: "", content: "" }
  }
}

async function fetchAddustourArticleContent(url: string): Promise<{ title: string; excerpt: string; imageUrl: string; publishedAt: string; content: string }> {
  try {
    const html = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar,en;q=0.9",
      }
    }).then((r) => r.text())

    let title = ""
    let excerpt = ""
    let imageUrl = ""
    let publishedAt = ""

    const ogTitle = html.match(/<meta\b[^>]*property="og:title"[^>]*content="([^"]+)"/i)
    if (ogTitle) title = cleanText(ogTitle[1])
    if (!title) {
      const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
      if (h1) title = cleanText(h1[1])
    }

    const metaDesc = html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]+)"/i)
    if (metaDesc) excerpt = cleanText(metaDesc[1])

    const ogImage = html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i)
    if (ogImage) imageUrl = ogImage[1]

    const ptMatch = html.match(/<meta\b[^>]*property="article:published_time"[^>]*content="([^"]+)"/i)
    if (ptMatch) publishedAt = ptMatch[1]

    let bodyHtml = ""
    const bodyMatch = html.match(/<div\b[^>]*class="[^"]*\barticle-body\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    if (bodyMatch) bodyHtml = bodyMatch[1]
    if (!bodyHtml) {
      const contentDiv = html.match(/<div\b[^>]*class="[^"]*\bcontent\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      if (contentDiv) bodyHtml = contentDiv[1]
    }

    if (bodyHtml) {
      bodyHtml = bodyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      bodyHtml = bodyHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    }

    const content = bodyHtml ? htmlToTiptapJson(bodyHtml) : ""

    return { title, excerpt, imageUrl, publishedAt, content }
  } catch {
    return { title: "", excerpt: "", imageUrl: "", publishedAt: "", content: "" }
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
  skynews: {
    searchUrl: (query) => `https://www.skynewsarabia.com/search?q=${encodeURIComponent(query)}`,
    categoryUrl: (category) => {
      const map: Record<string, string> = {
        business: "https://www.skynewsarabia.com/business",
        middle_east: "https://www.skynewsarabia.com/middle-east",
        sport: "https://www.skynewsarabia.com/sport",
        technology: "https://www.skynewsarabia.com/technology",
        varieties: "https://www.skynewsarabia.com/varieties",
        world: "https://www.skynewsarabia.com/world",
      }
      return map[category] ?? null
    },
    supportedCategories: {
      business: "https://www.skynewsarabia.com/business",
      middle_east: "https://www.skynewsarabia.com/middle-east",
      sport: "https://www.skynewsarabia.com/sport",
      technology: "https://www.skynewsarabia.com/technology",
      varieties: "https://www.skynewsarabia.com/varieties",
      world: "https://www.skynewsarabia.com/world",
    },
    searchHeaders: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "news-worker/3.0 (Sky News Arabia frontend scraper)",
      "accept-language": "ar,en;q=0.8",
    },
    parse: parseSkynews,
  },
  youm7: {
    searchUrl: (query) => `https://www.youm7.com/Home/Search?allwords=${encodeURIComponent(query)}`,
    categoryUrl: (category) => {
      const map: Record<string, string> = {
        politics: "https://www.youm7.com/Section/سياسة/319/1",
        world: "https://www.youm7.com/Section/أخبار-عالمية/286/1",
        arab: "https://www.youm7.com/Section/أخبار-عربية/88/1",
        business: "https://www.youm7.com/Section/اقتصاد-وبورصة/297/1",
        sport: "https://www.youm7.com/Section/أخبار-الرياضة/298/1",
        art: "https://www.youm7.com/Section/فن/48/1",
        health: "https://www.youm7.com/Section/صحة-وطب/245/1",
        tech: "https://www.youm7.com/Section/علوم-و-تكنولوجيا/328/1",
      }
      return map[category] ?? null
    },
    supportedCategories: {
      politics: "https://www.youm7.com/Section/سياسة/319/1",
      world: "https://www.youm7.com/Section/أخبار-عالمية/286/1",
      arab: "https://www.youm7.com/Section/أخبار-عربية/88/1",
      business: "https://www.youm7.com/Section/اقتصاد-وبورصة/297/1",
      sport: "https://www.youm7.com/Section/أخبار-الرياضة/298/1",
      art: "https://www.youm7.com/Section/فن/48/1",
      health: "https://www.youm7.com/Section/صحة-وطب/245/1",
      tech: "https://www.youm7.com/Section/علوم-و-تكنولوجيا/328/1",
    },
    searchHeaders: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "accept-language": "ar,en;q=0.8",
    },
    parse: parseYoum7,
  },
  bbc: {
    searchUrl: (query) => `https://www.bbc.com/arabic/search?q=${encodeURIComponent(query)}`,
    categoryUrl: (category) => {
      const map: Record<string, string> = {
        world: "https://www.bbc.com/arabic",
        middle_east: "https://www.bbc.com/arabic",
        tech: "https://www.bbc.com/arabic",
        sport: "https://www.bbc.com/arabic",
      }
      return map[category] ?? null
    },
    supportedCategories: {
      world: "https://www.bbc.com/arabic",
      middle_east: "https://www.bbc.com/arabic",
      tech: "https://www.bbc.com/arabic",
      sport: "https://www.bbc.com/arabic",
    },
    searchHeaders: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "accept-language": "ar,en;q=0.8",
    },
    parse: parseBbc,
  },
  alaraby: {
    searchUrl: (query) => `https://www.aajeg.com/search?search_api_fulltext=${encodeURIComponent(query)}`,
    categoryUrl: (category) => {
      const map: Record<string, string> = {
        "news-egypt": "https://www.aajeg.com/news/egypt",
        "news-syria": "https://www.aajeg.com/news/syria",
        "news-palestine": "https://www.aajeg.com/news/palestine",
        "news-gulf": "https://www.aajeg.com/news/gulf",
        "news-iraq": "https://www.aajeg.com/news/iraq",
        "news-world": "https://www.aajeg.com/news/world",
        politics: "https://www.aajeg.com/politics",
        economy: "https://www.aajeg.com/economy",
        sport: "https://www.aajeg.com/sport",
        culture: "https://www.aajeg.com/culture",
      }
      return map[category] ?? null
    },
    supportedCategories: {
      "news-egypt": "https://www.aajeg.com/news/egypt",
      "news-syria": "https://www.aajeg.com/news/syria",
      "news-palestine": "https://www.aajeg.com/news/palestine",
      "news-gulf": "https://www.aajeg.com/news/gulf",
      "news-iraq": "https://www.aajeg.com/news/iraq",
      "news-world": "https://www.aajeg.com/news/world",
      politics: "https://www.aajeg.com/politics",
      economy: "https://www.aajeg.com/economy",
      sport: "https://www.aajeg.com/sport",
      culture: "https://www.aajeg.com/culture",
    },
    searchHeaders: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "accept-language": "ar,en;q=0.9",
    },
    parse: parseAlaraby,
  },
  elwatan: {
    searchUrl: (query) => `https://www.elwatannews.com/Home/Search?allwords=${encodeURIComponent(query)}`,
    categoryUrl: (category) => {
      const map: Record<string, string> = {
        egypt: "https://www.elwatannews.com/section/115",
        world: "https://www.elwatannews.com/section/39",
        business: "https://www.elwatannews.com/section/77",
        art: "https://www.elwatannews.com/section/60",
        misc: "https://www.elwatannews.com/section/52",
        accidents: "https://www.elwatannews.com/section/99",
      }
      return map[category] ?? null
    },
    supportedCategories: {
      egypt: "https://www.elwatannews.com/section/115",
      world: "https://www.elwatannews.com/section/39",
      business: "https://www.elwatannews.com/section/77",
      art: "https://www.elwatannews.com/section/60",
      misc: "https://www.elwatannews.com/section/52",
      accidents: "https://www.elwatannews.com/section/99",
    },
    searchHeaders: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "accept-language": "ar,en;q=0.9",
    },
    parse: parseElwatan,
  },
  alquds: {
    searchUrl: (query) => `https://www.alquds.com/search?q=${encodeURIComponent(query)}`,
    categoryUrl: (category) => {
      const map: Record<string, string> = {
        palestine: "https://www.alquds.com/ar/categories/palestine",
        "arab-and-world": "https://www.alquds.com/ar/categories/arab-and-world",
        misc: "https://www.alquds.com/ar/categories/misc",
        business: "https://www.alquds.com/ar/categories/business",
        sport: "https://www.alquds.com/ar/categories/sport",
        opinions: "https://www.alquds.com/ar/categories/opinions",
      }
      return map[category] ?? null
    },
    supportedCategories: {
      palestine: "https://www.alquds.com/ar/categories/palestine",
      "arab-and-world": "https://www.alquds.com/ar/categories/arab-and-world",
      misc: "https://www.alquds.com/ar/categories/misc",
      business: "https://www.alquds.com/ar/categories/business",
      sport: "https://www.alquds.com/ar/categories/sport",
      opinions: "https://www.alquds.com/ar/categories/opinions",
    },
    parse: parseAlquds,
  },
  shabiba: {
    searchUrl: (query) => `https://shabiba.com/search?q=${encodeURIComponent(query)}`,
    categoryUrl: (category) => {
      const map: Record<string, string> = {
        local: "https://shabiba.com/category/بلادنا",
        event: "https://shabiba.com/category/الحدث",
        economy: "https://shabiba.com/category/مؤشر",
        sports: "https://shabiba.com/category/الجماهير",
        tech: "https://shabiba.com/category/تكنولوجيا",
        lifestyle: "https://shabiba.com/category/مزاج",
      }
      return map[category] ?? null
    },
    supportedCategories: {
      local: "https://shabiba.com/category/بلادنا",
      event: "https://shabiba.com/category/الحدث",
      economy: "https://shabiba.com/category/مؤشر",
      sports: "https://shabiba.com/category/الجماهير",
      tech: "https://shabiba.com/category/تكنولوجيا",
      lifestyle: "https://shabiba.com/category/مزاج",
    },
    searchHeaders: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "accept-language": "ar,en;q=0.9",
    },
    parse: parseShabiba,
  },
  addustour: {
    searchUrl: (query) => `https://addustour.com/search.php?search=${encodeURIComponent(query)}`,
    categoryUrl: (category) => {
      const map: Record<string, string> = {
        local: "https://addustour.com/categories/1-محليات",
        "arab-world": "https://addustour.com/categories/5-عربي-ودولي",
        economy: "https://addustour.com/categories/4-اقتصاد",
        sports: "https://addustour.com/categories/7-رياضة",
        culture: "https://addustour.com/categories/3-ثقافة",
        opinions: "https://addustour.com/categories/8-قضايا-واراء",
      }
      return map[category] ?? null
    },
    supportedCategories: {
      local: "https://addustour.com/categories/1-محليات",
      "arab-world": "https://addustour.com/categories/5-عربي-ودولي",
      economy: "https://addustour.com/categories/4-اقتصاد",
      sports: "https://addustour.com/categories/7-رياضة",
      culture: "https://addustour.com/categories/3-ثقافة",
      opinions: "https://addustour.com/categories/8-قضايا-واراء",
    },
    searchHeaders: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "accept-language": "ar,en;q=0.9",
    },
    parse: parseAddustour,
  },
  alhurra: {
    searchUrl: (query) => `https://alhurra.com/?s=${encodeURIComponent(query)}`,
    categoryUrl: (category) => {
      const map: Record<string, string> = {
        america: "https://alhurra.com/category/أميركا",
        iran: "https://alhurra.com/category/إيران",
        lebanon: "https://alhurra.com/category/لبنان",
        israel: "https://alhurra.com/category/إسرائيل",
        gulf: "https://alhurra.com/category/الخليج",
        iraq: "https://alhurra.com/category/العراق",
        egypt: "https://alhurra.com/category/مصر",
        syria: "https://alhurra.com/category/سوريا",
      }
      return map[category] ?? null
    },
    supportedCategories: {
      america: "https://alhurra.com/category/أميركا",
      iran: "https://alhurra.com/category/إيران",
      lebanon: "https://alhurra.com/category/لبنان",
      israel: "https://alhurra.com/category/إسرائيل",
      gulf: "https://alhurra.com/category/الخليج",
      iraq: "https://alhurra.com/category/العراق",
      egypt: "https://alhurra.com/category/مصر",
      syria: "https://alhurra.com/category/سوريا",
    },
    searchHeaders: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "accept-language": "ar,en;q=0.9",
    },
    parse: parseAlhurra,
  },
  aawsat: {
    searchUrl: (query) => `https://aawsat.com/search?search=${encodeURIComponent(query)}`,
    categoryUrl: (category) => {
      const map: Record<string, string> = {
        "middle-east": "https://aawsat.com/%D8%A7%D9%84%D8%B4%D8%B1%D9%82-%D8%A7%D9%84%D8%A3%D9%88%D8%B3%D8%B7",
        world: "https://aawsat.com/%D8%A7%D9%84%D8%B9%D8%A7%D9%84%D9%85",
        economy: "https://aawsat.com/%D8%A7%D9%84%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF",
        sport: "https://aawsat.com/%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D8%A9",
        culture: "https://aawsat.com/%D8%AB%D9%82%D8%A7%D9%81%D8%A9-%D9%88%D9%81%D9%86%D9%88%D9%86",
      }
      return map[category] ?? null
    },
    supportedCategories: {
      "middle-east": "https://aawsat.com/%D8%A7%D9%84%D8%B4%D8%B1%D9%82-%D8%A7%D9%84%D8%A3%D9%88%D8%B3%D8%B7",
      world: "https://aawsat.com/%D8%A7%D9%84%D8%B9%D8%A7%D9%84%D9%85",
      economy: "https://aawsat.com/%D8%A7%D9%84%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF",
      sport: "https://aawsat.com/%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D8%A9",
      culture: "https://aawsat.com/%D8%AB%D9%82%D8%A7%D9%81%D8%A9-%D9%88%D9%81%D9%86%D9%88%D9%86",
    },
    searchHeaders: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "accept-language": "ar,en;q=0.9",
    },
    parse: parseAawsat,
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
    if (this.source === "rt") return "world"
    if (this.source === "skynews") return "world"
    if (this.source === "youm7") return "politics"
    if (this.source === "bbc") return "world"
    if (this.source === "alaraby") return "politics"
    if (this.source === "elwatan") return "world"
    if (this.source === "alquds") return "palestine"
    if (this.source === "shabiba") return "local"
    if (this.source === "addustour") return "local"
    if (this.source === "alhurra") return "america"
    if (this.source === "aawsat") return "middle-east"
    return "news"
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
    const html = await fetch(url, { headers, cache: "no-store" }).then(async (res) => {
      const text = await res.text()
      if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${text.slice(0, 200)}`)
      return text
    })
    const items = cfg.parse(html)
    
    // Fetch content for each article to get full text + images
    const itemsWithContent = await Promise.all(
      items.slice(0, 5).map(async (item) => {
        if (this.source === "rt") {
          const { excerpt, imageUrl, publishedAt, content } = await fetchRtArticleContent(item.url)
          return {
            ...item,
            excerpt: excerpt || item.excerpt,
            imageUrl: imageUrl || item.imageUrl,
            publishedAt: publishedAt || item.publishedAt,
            content,
          }
          } else if (this.source === "skynews") {
          const { title, excerpt, imageUrl, publishedAt, content } = await fetchSkynewsArticleContent(item.url)
          return {
            ...item,
            title: title || item.title,
            excerpt: excerpt || item.excerpt,
            imageUrl: imageUrl || item.imageUrl,
            publishedAt: publishedAt || item.publishedAt,
            content,
          }
        } else if (this.source === "youm7") {
          const { title, excerpt, imageUrl, publishedAt, content } = await fetchYoum7ArticleContent(item.url)
          return {
            ...item,
            title: title || item.title,
            excerpt: excerpt || item.excerpt,
            imageUrl: imageUrl || item.imageUrl,
            publishedAt: publishedAt || item.publishedAt,
            content,
          }
        } else if (this.source === "bbc") {
          const { title, excerpt, imageUrl, publishedAt, content } = await fetchBbcArticleContent(item.url)
          return {
            ...item,
            title: title || item.title,
            excerpt: excerpt || item.excerpt,
            imageUrl: imageUrl || item.imageUrl,
            publishedAt: publishedAt || item.publishedAt,
            content,
          }
        } else if (this.source === "alaraby") {
          const { title, excerpt, imageUrl, publishedAt, content } = await fetchAlarabyArticleContent(item.url)
          return {
            ...item,
            title: title || item.title,
            excerpt: excerpt || item.excerpt,
            imageUrl: imageUrl || item.imageUrl,
            publishedAt: publishedAt || item.publishedAt,
            content,
          }
        } else if (this.source === "alquds") {
          const { title, excerpt, imageUrl, publishedAt, content } = await fetchAlqudsArticleContent(item.url)
          return {
            ...item,
            title: title || item.title,
            excerpt: excerpt || item.excerpt,
            imageUrl: imageUrl || item.imageUrl,
            publishedAt: publishedAt || item.publishedAt,
            content,
          }
        } else if (this.source === "shabiba") {
          const { title, excerpt, imageUrl, publishedAt, content } = await fetchShabibaArticleContent(item.url)
          return {
            ...item,
            title: title || item.title,
            excerpt: excerpt || item.excerpt,
            imageUrl: imageUrl || item.imageUrl,
            publishedAt: publishedAt || item.publishedAt,
            content,
          }
        } else if (this.source === "addustour") {
          const { title, excerpt, imageUrl, publishedAt, content } = await fetchAddustourArticleContent(item.url)
          return {
            ...item,
            title: title || item.title,
            excerpt: excerpt || item.excerpt,
            imageUrl: imageUrl || item.imageUrl,
            publishedAt: publishedAt || item.publishedAt,
            content,
          }
        } else if (this.source === "elwatan") {
          const { title, excerpt, imageUrl, publishedAt, content } = await fetchElwatanArticleContent(item.url)
          return {
            ...item,
            title: title || item.title,
            excerpt: excerpt || item.excerpt,
            imageUrl: imageUrl || item.imageUrl,
            publishedAt: publishedAt || item.publishedAt,
            content,
          }
        } else if (this.source === "alhurra") {
          const { title, excerpt, imageUrl, publishedAt, content } = await fetchAlhurraArticleContent(item.url)
          return {
            ...item,
            title: title || item.title,
            excerpt: excerpt || item.excerpt,
            imageUrl: imageUrl || item.imageUrl,
            publishedAt: publishedAt || item.publishedAt,
            content,
          }
        } else if (this.source === "aawsat") {
          const { title, excerpt, imageUrl, publishedAt, content } = await fetchAawsatArticleContent(item.url)
          return {
            ...item,
            title: title || item.title,
            excerpt: excerpt || item.excerpt,
            imageUrl: imageUrl || item.imageUrl,
            publishedAt: publishedAt || item.publishedAt,
            content,
          }
        } else {
          const { title, excerpt, imageUrl, publishedAt, content } = await fetchIndependentArticleContent(item.url)
          return {
            ...item,
            title: title || item.title,
            excerpt: excerpt || item.excerpt,
            imageUrl: imageUrl || item.imageUrl,
            publishedAt: publishedAt || item.publishedAt,
            content,
          }
        }
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
