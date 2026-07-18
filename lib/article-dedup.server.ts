import "server-only"
import { desc, sql } from "drizzle-orm"
import { getDb } from "@/db/client"
import { articles, generatedArticles } from "@/db/schema"

function titleSimilarity(a: string, b: string): number {
  const t1 = a.replace(/\s/g, "")
  const t2 = b.replace(/\s/g, "")
  let common = 0
  for (let i = 0; i < Math.min(t1.length, t2.length); i++) {
    if (t1[i] === t2[i]) common++
  }
  return common / Math.max(t1.length, t2.length)
}

function sharedKeywords(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 3))
  const wordsB = new Set(b.split(/\s+/).filter((w) => w.length > 3))
  let count = 0
  for (const w of wordsA) {
    if (wordsB.has(w)) count++
  }
  return count
}

export async function isDuplicateTitle(newTitle: string, threshold = 0.5): Promise<boolean> {
  const db = getDb()
  const existing = await db
    .select({ title: articles.title })
    .from(articles)
    .orderBy(desc(articles.createdAt))
    .limit(100)

  for (const e of existing) {
    if (titleSimilarity(newTitle, e.title) > threshold) return true
  }
  return false
}

export async function findMatchingTopic(
  newTitle: string,
  existingTopics: { id: string; title: string }[],
): Promise<{ id: string; title: string } | null> {
  let best: { id: string; title: string } | null = null
  let bestScore = 0

  for (const t of existingTopics) {
    const kw = sharedKeywords(newTitle, t.title)
    if (kw > bestScore) {
      bestScore = kw
      best = t
    }
  }

  if (bestScore >= 2) return best
  return null
}

export async function loadAllExistingTopics(): Promise<{ id: string; title: string }[]> {
  const db = getDb()
  const rows = await db
    .select({ id: generatedArticles.id, title: generatedArticles.title })
    .from(generatedArticles)
    .orderBy(desc(generatedArticles.createdAt))
    .limit(500)
  return rows
}
