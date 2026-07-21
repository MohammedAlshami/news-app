import "dotenv/config"

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!
const DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID!
const TOKEN = process.env.CLOUDFLARE_D1_TOKEN!

function uuid() {
  return crypto.randomUUID()
}

async function runQuery(sql: string) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/raw`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params: [], method: "run" }),
    },
  )
  const data = await res.json()
  return data
}

async function main() {
  // Drop if exists then create
  await runQuery(`DROP TABLE IF EXISTS finance_revenue`)
  
  await runQuery(`
    CREATE TABLE finance_revenue (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('google_ads', 'memberships', 'paid_articles', 'direct_ads')),
      amount REAL NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )
  `)
  console.log("Table created")

  // Seed sample revenue data for the last 30 days
  const sources = ["google_ads", "memberships", "paid_articles", "direct_ads"]
  const sourceLabels = {
    google_ads: "إعلانات Google",
    memberships: "اشتراكات",
    paid_articles: "مقالات مدفوعة",
    direct_ads: "إعلانات مباشرة"
  }
  
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]
    for (const source of sources) {
      const amount = Math.round((Math.random() * 500 + 50) * 100) / 100
      const id = uuid()
      const desc = sourceLabels[source as keyof typeof sourceLabels]
      await runQuery(
        `INSERT INTO finance_revenue (id, date, source, amount, description) VALUES ('${id}', '${dateStr}', '${source}', ${amount}, '${desc}')`
      )
    }
  }
  console.log("Done seeding finance data")
}

main().catch(console.error)
