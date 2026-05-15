import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })

const url = "https://arabic.rt.com/business/1789162-%D8%B5%D9%86%D8%AF%D9%88%D9%82-%D8%A7%D9%84%D9%86%D9%82%D8%AF-%D8%A7%D9%84%D8%AD%D9%88%D8%A7%D8%B1-%D8%A8%D9%8A%D9%86-%D9%88%D8%A7%D8%B4%D9%86%D8%B7%D9%86-%D9%88%D8%A8%D9%83%D9%8A%D9%86-%D9%8A%D8%AF%D8%B9%D9%85-%D8%A7%D8%B3%D8%AA%D9%82%D8%B1%D8%A7%D8%B1-%D8%A7%D9%84%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF-%D8%A7%D9%84%D8%B9%D8%A7%D9%84%D9%85%D9%8A/"

const html = await fetch(url, {
  headers: {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "accept": "text/html,application/xhtml+xml",
    "accept-language": "ar,en;q=0.9",
  }
}).then(r => r.text())

console.log("HTML length:", html.length)

// Test intro-text
const introMatch = html.match(/<div\b[^>]*class="[^"]*\bmain-article__intro-text\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
console.log("intro-text match:", introMatch ? introMatch[1].slice(0, 200) : "NOT FOUND")

// Test editor-content — greedy match to get full block
const editorMatch = html.match(/<div\b[^>]*class="[^"]*\beditor-content\b[^"]*"[^>]*>([\s\S]+?)<\/div>\s*<\/div>/i)
console.log("editor-content match:", editorMatch ? editorMatch[1].slice(0, 300) : "NOT FOUND")

// Try a broader match
const broadMatch = html.match(/<div\b[^>]*class="[^"]*main-article__editor-content[^"]*"[^>]*>([\s\S]+)/i)
console.log("broad editor match:", broadMatch ? broadMatch[1].slice(0, 300) : "NOT FOUND")
