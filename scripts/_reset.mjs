import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })

const { CLOUDFLARE_ACCOUNT_ID: a, CLOUDFLARE_DATABASE_ID: d, CLOUDFLARE_D1_TOKEN: t } = process.env

async function run(sql) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${a}/d1/database/${d}/raw`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params: [], method: "run" }),
    },
  )
  const data = await res.json()
  console.log(sql.slice(0, 55), "->", data.success ? data.result[0].meta.changes + " rows" : data.errors[0].message)
}

await run(`UPDATE news_sources SET is_enabled = 0 WHERE key = 'independent'`)
await run(`DELETE FROM generated_articles`)
await run(`DELETE FROM scraped_news`)
await run(`DELETE FROM topics`)
console.log("Done.")
