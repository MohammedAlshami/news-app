/**
 * Fetches all scraped_news rows inserted in the last 24 hours from Cloudflare D1.
 *
 * Run from repo root:
 *   npx tsx scripts/fetch-last-24h-scraped-news.ts
 *
 * Requires .env.local with:
 *   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, CLOUDFLARE_D1_TOKEN
 *
 * Optional env vars:
 *   HOURS=48          — look back N hours instead of 24 (default: 24)
 *   OUTPUT=json       — print raw JSON instead of a table (default: table)
 */
import { config } from "dotenv"
import { gte } from "drizzle-orm"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { getDb } from "../db/client"
import { scrapedNews } from "../db/schema"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })
config({ path: join(root, ".env") })

const HOURS = Number(process.env.HOURS ?? "24")
const OUTPUT = process.env.OUTPUT ?? "table"

async function main() {
  const since = new Date(Date.now() - HOURS * 60 * 60 * 1000)
  console.log(`\nFetching scraped news from the last ${HOURS}h (since ${since.toISOString()})...\n`)

  const db = getDb()

  const rows = await db
    .select()
    .from(scrapedNews)
    .where(gte(scrapedNews.scrapedAt, since))
    .orderBy(scrapedNews.scrapedAt)

  if (rows.length === 0) {
    console.log("No scraped news found in the last", HOURS, "hours.")
    return
  }

  if (OUTPUT === "json") {
    console.log(JSON.stringify(rows, null, 2))
    return
  }

  // ── Table output ──────────────────────────────────────────────────────────
  const COL_WIDTHS = { scrapedAt: 24, source: 14, category: 14, title: 60, url: 50 }

  const pad = (s: string, n: number) => s.slice(0, n).padEnd(n)

  const header = [
    pad("Scraped At", COL_WIDTHS.scrapedAt),
    pad("Source", COL_WIDTHS.source),
    pad("Category", COL_WIDTHS.category),
    pad("Title", COL_WIDTHS.title),
    pad("URL", COL_WIDTHS.url),
  ].join(" | ")

  const divider = "-".repeat(header.length)

  console.log(divider)
  console.log(header)
  console.log(divider)

  for (const row of rows) {
    const scrapedAtStr = row.scrapedAt instanceof Date
      ? row.scrapedAt.toISOString()
      : new Date(row.scrapedAt as number).toISOString()

    console.log(
      [
        pad(scrapedAtStr, COL_WIDTHS.scrapedAt),
        pad(row.source, COL_WIDTHS.source),
        pad(row.category, COL_WIDTHS.category),
        pad(row.title, COL_WIDTHS.title),
        pad(row.url, COL_WIDTHS.url),
      ].join(" | "),
    )
  }

  console.log(divider)
  console.log(`\nTotal: ${rows.length} article(s) scraped in the last ${HOURS}h.\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
