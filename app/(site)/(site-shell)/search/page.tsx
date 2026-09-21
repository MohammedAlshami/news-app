import type { Metadata } from "next"

import { getPublishedArticles } from "@/lib/db-public-articles.server"
import { ar } from "@/lib/ui-ar"
import SearchClient from "./search-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: ar.searchMetaTitle,
  description: ar.searchMetaDescription,
}

type PageProps = {
  searchParams?: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {}
  const query = (sp.q ?? "").trim()
  const articles = await getPublishedArticles()

  const safe = articles.map((a) => ({
    id: a.id,
    title: a.title,
    excerpt: a.excerpt,
    date: a.date,
    categoryIds: a.categoryIds,
    coverImageUrl: a.coverImageUrl,
    isMemberOnly: a.isMemberOnly,
  }))

  return <SearchClient articles={safe} initialQuery={query} />
}
