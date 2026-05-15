// Quick test: import the scraper and scrape one article, print content length
import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })

// Inline the fetcher logic to test it directly
const url = "https://arabic.rt.com/business/1789162-%D8%B5%D9%86%D8%AF%D9%88%D9%82-%D8%A7%D9%84%D9%86%D9%82%D8%AF-%D8%A7%D9%84%D8%AD%D9%88%D8%A7%D8%B1-%D8%A8%D9%8A%D9%86-%D9%88%D8%A7%D8%B4%D9%86%D8%B7%D9%86-%D9%88%D8%A8%D9%83%D9%8A%D9%86-%D9%8A%D8%AF%D8%B9%D9%85-%D8%A7%D8%B3%D8%AA%D9%82%D8%B1%D8%A7%D8%B1-%D8%A7%D9%84%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF-%D8%A7%D9%84%D8%B9%D8%A7%D9%84%D9%85%D9%8A/"

const html = await fetch(url, {
  headers: {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "accept": "text/html",
    "accept-language": "ar,en;q=0.9",
  }
}).then(r => r.text())

// Excerpt
const introBlock = html.match(/<div\b[^>]*class="[^"]*\bmain-article__intro-text\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
let excerpt = ""
if (introBlock) {
  const summaryP = introBlock[1].match(/<p\b[^>]*class="[^"]*\bmain-article__summary\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
  if (summaryP) excerpt = summaryP[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}
console.log("EXCERPT:", excerpt.slice(0, 150))

// Content
const editorMatch = html.match(/<div\b[^>]*class="[^"]*\beditor-content\b[^"]*"[^>]*>([\s\S]+)/i)
if (editorMatch) {
  let contentHtml = editorMatch[1]
  const cutoff = contentHtml.search(/<div\b[^>]*class="[^"]*\bmain-article__block--tags\b[^"]*"/i)
  if (cutoff > 0) contentHtml = contentHtml.slice(0, cutoff)
  // Extract just the text from paragraphs
  const paras = [...contentHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
  console.log("PARAGRAPHS:", paras.length)
  paras.slice(0, 3).forEach((p, i) => console.log(`  [${i+1}]`, p.slice(0, 120)))
} else {
  console.log("CONTENT: NOT FOUND")
}
