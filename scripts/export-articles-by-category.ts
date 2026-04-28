/**
 * One-shot: fetch BBC Arabic RSS, classify items into your site categories (by Arabic keywords),
 * keep up to 10 items per category, write JSON.
 *
 * Run from repo root (dev server optional — only for loading category ids/names):
 *   npx tsx scripts/export-articles-by-category.ts
 *
 * Optional: `SITE_URL=http://127.0.0.1:3000` to merge category ids from GET /api/categories.
 *
 * Output: `scripts/articles-by-category.export.json`
 *
 * Note: BBC currently serves the same ~25-item pool on many Arabic feed paths; classification
 * is heuristic (keyword scoring). Respect BBC terms and attribution if you use this data.
 */
import { config } from "dotenv"
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })
config({ path: join(root, ".env") })

const BBC_ARABIC_RSS = "https://feeds.bbci.co.uk/arabic/rss.xml"
const PER_CATEGORY = 10

/** Default site categories if /api/categories is unreachable */
const FALLBACK_CATEGORIES: { id: string; name: string }[] = [
  { id: "11111111-1111-1111-1111-111111111111", name: "تكنولوجيا" },
  { id: "22222222-2222-2222-2222-222222222222", name: "سياسة" },
  { id: "33333333-3333-3333-3333-333333333333", name: "رياضة" },
  { id: "44444444-4444-4444-4444-444444444444", name: "اقتصاد" },
]

const KEYWORDS_BY_CATEGORY_NAME: Record<string, string[]> = {
  تكنولوجيا: [
    "تكنولوجيا",
    "تقنية",
    "تقني",
    "ذكاء اصطناعي",
    "إنترنت",
    "برمج",
    "هاتف",
    "حاسوب",
    "سيبراني",
    "معلوماتية",
    "رقمي",
    "تطبيق",
    "برمجيات",
    "شيرنوبل",
    "مفاعل",
    "فضاء",
    "طائرة مسيرة",
    "مسيرة",
    "إلكترون",
  ],
  سياسة: [
    "سياس",
    "انتخاب",
    "حكوم",
    "برلمان",
    "دبلوماس",
    "قمة",
    "حرب",
    "ترامب",
    "إيران",
    "أمريك",
    "سوريا",
    "سوري",
    "العراق",
    "عراق",
    "وزير",
    "رئاس",
    "محاكمة",
    "نظام",
    "عاطف نجيب",
    "بشار",
    "كوبا",
    "روسيا",
    "أوكران",
    "فيتنام",
    "خليج",
    "سفير",
    "عقوبات",
  ],
  رياضة: [
    "رياض",
    "دوري",
    "مباراة",
    "كأس",
    "أولمبياد",
    "لاعب",
    "نادي",
    "فريق",
    "كرة",
    "ملاكمة",
    "محمد علي",
    "بطولة",
    "الجيش الأمريكي",
    "ملاكم",
  ],
  اقتصاد: [
    "اقتصاد",
    "أسواق",
    "سوق",
    "نفط",
    "أوبك",
    "بنك",
    "أسهم",
    "دولار",
    "شركات",
    "استثمار",
    "ميزانية",
    "تجار",
    "مالي",
    "تداول",
    "إمارات",
    "منظمة أوبك",
    "قطاع الطاقة",
    "الطاقة",
  ],
}

export type BbcArabicItem = {
  title: string
  description: string
  link: string
  pubDate: string
  guid?: string
  /** From RSS `media:thumbnail` when present; otherwise null */
  imageUrl: string | null
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

function extractCdataOrText(raw: string): string {
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/)
  const inner = cdata ? cdata[1] : raw
  return decodeBasicEntities(inner.trim())
}

function firstTag(block: string, tag: string): string {
  const re = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
    "i",
  )
  const m = block.match(re)
  if (!m) return ""
  return extractCdataOrText(m[1].trim())
}

/** BBC Arabic RSS uses Media RSS `<media:thumbnail url="..."/>`. */
function firstMediaThumbnailUrl(block: string): string | undefined {
  const m = block.match(/<media:thumbnail\b[^>]*\burl="([^"]+)"/i)
  if (!m?.[1]) return undefined
  return decodeBasicEntities(m[1].trim())
}

function parseRssItems(xml: string): BbcArabicItem[] {
  const items: BbcArabicItem[] = []
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1]
    const title = stripTags(firstTag(block, "title"))
    const link = stripTags(firstTag(block, "link"))
    const description = stripTags(firstTag(block, "description"))
    const pubDate = stripTags(firstTag(block, "pubDate"))
    const guid = stripTags(firstTag(block, "guid"))
    const imageUrl = firstMediaThumbnailUrl(block) ?? null
    if (title && link) {
      items.push({
        title,
        link,
        description,
        pubDate,
        guid: guid || undefined,
        imageUrl,
      })
    }
  }
  return items
}

function keywordsFor(name: string): string[] {
  return KEYWORDS_BY_CATEGORY_NAME[name] ?? []
}

function scoreForCategory(text: string, categoryName: string): number {
  const keys = keywordsFor(categoryName)
  let s = 0
  for (const k of keys) {
    if (text.includes(k)) s += 1
  }
  return s
}

function bestCategoryOrder(item: BbcArabicItem, categoryNames: string[]): string[] {
  const text = `${item.title} ${item.description}`
  return [...categoryNames].sort(
    (a, b) => scoreForCategory(text, b) - scoreForCategory(text, a),
  )
}

async function loadCategoriesFromApi(): Promise<{ id: string; name: string }[]> {
  const base = (process.env.SITE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "")
  try {
    const res = await fetch(`${base}/api/categories`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as {
      categories?: { id: string; name: string }[]
    }
    const list = data.categories ?? []
    if (list.length === 0) return FALLBACK_CATEGORIES
    return list.map((c) => ({ id: c.id, name: c.name }))
  } catch {
    return FALLBACK_CATEGORIES
  }
}

async function main() {
  const targets = await loadCategoriesFromApi()
  const names = targets.map((t) => t.name)

  const res = await fetch(BBC_ARABIC_RSS, {
    headers: {
      "User-Agent": "news-export-script/1.0 (BBC Arabic RSS; one-shot)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  })
  if (!res.ok) {
    throw new Error(`BBC RSS failed: ${res.status} ${await res.text()}`)
  }
  const xml = await res.text()
  const allItems = parseRssItems(xml)

  const byName: Record<string, BbcArabicItem[]> = {}
  for (const t of targets) {
    byName[t.name] = []
  }

  const seenLink = new Set<string>()
  for (const item of allItems) {
    if (seenLink.has(item.link)) continue
    seenLink.add(item.link)
    const order = bestCategoryOrder(item, names)
    for (const cat of order) {
      if ((byName[cat]?.length ?? 0) < PER_CATEGORY) {
        byName[cat].push(item)
        break
      }
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    source: "BBC Arabic RSS",
    feedUrl: BBC_ARABIC_RSS,
    limitPerCategory: PER_CATEGORY,
    disclaimer:
      "Items are assigned by Arabic keyword overlap with your category names; BBC may return fewer than 40 distinct stories per fetch.",
    categories: targets.map((t) => ({
      id: t.id,
      name: t.name,
      articles: byName[t.name] ?? [],
    })),
    rawItemCount: allItems.length,
    uniqueItemCount: seenLink.size,
  }

  const outFile = join(root, "scripts", "articles-by-category.export.json")
  writeFileSync(outFile, JSON.stringify(out, null, 2), "utf8")
  console.log(`Wrote ${outFile}`)
  for (const c of out.categories) {
    console.log(`  ${c.name}: ${c.articles.length} (target ${PER_CATEGORY})`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
