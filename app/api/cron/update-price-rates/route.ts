import { NextResponse } from "next/server"
import { desc } from "drizzle-orm"

import { getDb } from "@/db/client"
import { priceRates } from "@/db/schema"

export const dynamic = "force-dynamic"

const SOURCE_URL = "https://www.2dec.net/rate.html"

type MarketKey = "sanaa" | "aden" | "gold"
type RateRow = {
  market: MarketKey
  assetType: "currency" | "gold"
  currencyCode: string
  currencyName: string
  sellRate: number
  buyRate: number
  sourceUrl: string
}

const CURRENCY_MAP: Record<string, string> = {
  "دولار امريكي": "USD",
  "ريال سعودي": "SAR",
  "يورو": "EUR",
  "درهم اماراتي": "AED",
  "جنيه مصري": "EGP",
  "ريال عماني": "OMR",
  "ريال قطري": "QAR",
  "رمبي صيني": "CNY",
  "جنية استرليني": "GBP",
  "دولار كندي": "CAD",
  "دولار استرالي": "AUD",
  "فرنك سويسري": "CHF",
  "دينار جزائري": "DZD",
  "دينار ليبي": "LYD",
  "ليرة تركي": "TRY",
  "رينغيت ماليزي": "MYR",
  "روبية هندي": "INR",
  "بير اثيوبي": "ETB",
  "فرنك جيبوتي": "DJF",
  "دينار كويتي": "KWD",
  "دينار اردني": "JOD",
  "دينار بحريني": "BHD",
  "جرام ذهب 18": "GOLD18",
  "جنيه ذهب": "GOLDCOIN",
  "جرام ذهب21": "GOLD21",
  "جرام بحريني21": "GOLDBH21",
  "جرام لازوردي21": "GOLDLZ21",
  "جرام تركي21": "GOLDTR21",
  "الجرام بالجمله": "GOLDGRAM",
}

function decodeText(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

function sectionHtml(html: string, heading: string) {
  const startMarker = `<h2 class="city-name">${heading}</h2>`
  const start = html.indexOf(startMarker)
  if (start < 0) return ""
  const tbodyStart = html.indexOf("<tbody>", start)
  if (tbodyStart < 0) return ""
  const tbodyEnd = html.indexOf("</tbody>", tbodyStart)
  if (tbodyEnd < 0) return ""
  return html.slice(tbodyStart, tbodyEnd)
}

function parseRows(section: string, market: MarketKey, assetType: RateRow["assetType"]) {
  const rows: RateRow[] = []
  const rowRe =
    /<span class="currency-name">([\s\S]*?)<\/span>[\s\S]*?<span class="price-value[^"]*">([\s\S]*?)<\/span>[\s\S]*?<span class="price-value[^"]*">([\s\S]*?)<\/span>/g

  for (const match of section.matchAll(rowRe)) {
    const currencyName = decodeText(match[1])
    const sell = Number(decodeText(match[2]).replace(/,/g, ""))
    const buy = Number(decodeText(match[3]).replace(/,/g, ""))
    const code = CURRENCY_MAP[currencyName]
    if (!code || !Number.isFinite(sell) || !Number.isFinite(buy)) continue

    rows.push({
      market,
      assetType,
      currencyCode: code,
      currencyName,
      sellRate: sell,
      buyRate: buy,
      sourceUrl: SOURCE_URL,
    })
  }

  return rows
}

async function scrapeRates(): Promise<RateRow[]> {
  const res = await fetch(SOURCE_URL, {
    headers: {
      "user-agent": "news-rate-sync/1.0",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  })
  if (!res.ok) throw new Error(`Failed to fetch rates page: ${res.status}`)

  const html = await res.text()
  const sanaa = sectionHtml(html, "صنعاء")
  const aden = sectionHtml(html, "عدن")
  const gold = sectionHtml(html, "أسعار الذهب")

  return [
    ...parseRows(sanaa, "sanaa", "currency"),
    ...parseRows(aden, "aden", "currency"),
    ...parseRows(gold, "gold", "gold"),
  ]
}

export async function GET() {
  const rows = await scrapeRates()
  const db = getDb()
  await db.delete(priceRates)
  for (const row of rows) {
    await db.insert(priceRates).values({
      market: row.market,
      assetType: row.assetType,
      currencyCode: row.currencyCode,
      currencyName: row.currencyName,
      sellRate: row.sellRate,
      buyRate: row.buyRate,
      sourceUrl: row.sourceUrl,
    })
  }
  const latest = await db.select().from(priceRates).orderBy(desc(priceRates.scrapedAt)).limit(5)
  return NextResponse.json({ ok: true, rows: rows.length, latest: latest.length })
}
