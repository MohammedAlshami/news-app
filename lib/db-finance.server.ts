import "server-only"

import { getDb } from "@/db/client"
import { financeRevenue } from "@/db/schema/finance"
import { sql } from "drizzle-orm"

export type FinanceSummary = {
  totalRevenue: number
  googleAds: number
  memberships: number
  paidArticles: number
  directAds: number
  dailyRevenue: { date: string; google_ads: number; memberships: number; paid_articles: number; direct_ads: number }[]
  revenueBySource: { source: string; amount: number }[]
}

export async function getFinanceSummary(days = 30): Promise<FinanceSummary> {
  const db = getDb()

  const all = await db
    .select()
    .from(financeRevenue)
    .where(sql`date >= date('now', '-${sql.raw(String(days))} days')`)
    .orderBy(financeRevenue.date)

  const totalRevenue = all.reduce((s, r) => s + r.amount, 0)
  const googleAds = all.filter(r => r.source === "google_ads").reduce((s, r) => s + r.amount, 0)
  const memberships = all.filter(r => r.source === "memberships").reduce((s, r) => s + r.amount, 0)
  const paidArticles = all.filter(r => r.source === "paid_articles").reduce((s, r) => s + r.amount, 0)
  const directAds = all.filter(r => r.source === "direct_ads").reduce((s, r) => s + r.amount, 0)

  const dateMap = new Map<string, Record<string, number>>()
  for (const r of all) {
    if (!dateMap.has(r.date)) {
      dateMap.set(r.date, { date: 0, google_ads: 0, memberships: 0, paid_articles: 0, direct_ads: 0 })
    }
    const entry = dateMap.get(r.date)!
    entry[r.source] = (entry[r.source] || 0) + r.amount
  }
  const dailyRevenue = Array.from(dateMap.entries())
    .map(([date, vals]) => ({ date, google_ads: vals.google_ads, memberships: vals.memberships, paid_articles: vals.paid_articles, direct_ads: vals.direct_ads }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const revenueBySource = [
    { source: "google_ads", amount: googleAds },
    { source: "memberships", amount: memberships },
    { source: "paid_articles", amount: paidArticles },
    { source: "direct_ads", amount: directAds },
  ]

  return { totalRevenue, googleAds, memberships, paidArticles, directAds, dailyRevenue, revenueBySource }
}
