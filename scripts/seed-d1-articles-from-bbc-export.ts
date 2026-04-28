/**
 * Deletes all rows in D1 `articles`, then inserts articles from
 * `scripts/articles-by-category.export.json` (run `npm run export:articles-by-category` first).
 *
 *   npx tsx scripts/seed-d1-articles-from-bbc-export.ts
 *
 * Requires `.env.local` with CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, CLOUDFLARE_D1_TOKEN.
 */
import { config } from "dotenv"
import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { getDb } from "../db/client"
import { articles } from "../db/schema"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })
config({ path: join(root, ".env") })

const EXPORT_PATH = join(root, "scripts", "articles-by-category.export.json")
const EXCERPT_MAX = 320

type ExportArticle = {
  title: string
  link: string
  description: string
  pubDate: string
  guid?: string
  imageUrl: string | null
}

type ExportFile = {
  categories: {
    id: string
    name: string
    articles: ExportArticle[]
  }[]
}

function excerptFrom(description: string): string {
  const t = description.replace(/\s+/g, " ").trim()
  if (t.length <= EXCERPT_MAX) return t || "…"
  return `${t.slice(0, EXCERPT_MAX - 1)}…`
}

function tiptapBody(description: string, link: string): string {
  const lead = description.replace(/\s+/g, " ").trim() || "…"
  const source = `المصدر: ${link}`
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: lead }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: source }],
      },
    ],
  })
}

function parsePubDateMs(pubDate: string): number {
  const t = Date.parse(pubDate)
  return Number.isFinite(t) ? t : Date.now()
}

/** D1/SQLite caps bound variables per statement; insert in small batches. */
const INSERT_BATCH = 4

async function main() {
  const raw = readFileSync(EXPORT_PATH, "utf8")
  const data = JSON.parse(raw) as ExportFile
  if (!Array.isArray(data.categories)) {
    throw new Error("Invalid export: missing categories[]")
  }

  const rows: {
    id: string
    title: string
    excerpt: string
    body: string
    views: number
    categoryId: string | null
    isPublished: boolean
    coverImageUrl: string | null
    createdAt: Date
    updatedAt: Date
  }[] = []

  for (const cat of data.categories) {
    for (const a of cat.articles) {
      const ts = parsePubDateMs(a.pubDate)
      const when = new Date(ts)
      rows.push({
        id: randomUUID(),
        title: a.title.trim(),
        excerpt: excerptFrom(a.description),
        body: tiptapBody(a.description, a.link),
        views: 0,
        categoryId: cat.id,
        isPublished: true,
        coverImageUrl: a.imageUrl?.trim() || null,
        createdAt: when,
        updatedAt: when,
      })
    }
  }

  if (rows.length === 0) {
    throw new Error("No articles in export file; run npm run export:articles-by-category first.")
  }

  const db = getDb()
  await db.delete(articles)
  console.log("Deleted existing articles (full table wipe).")

  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    const chunk = rows.slice(i, i + INSERT_BATCH)
    await db.insert(articles).values(chunk)
  }
  console.log(`Inserted ${rows.length} article(s) from ${EXPORT_PATH}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
