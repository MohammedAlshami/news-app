import { tiptapEmptyDocument } from "@/lib/tiptap-empty-doc"

export type ArticleFields = {
  title: string
  excerpt: string
  categoryIds: string[]
  isPublished: boolean
  isMemberOnly: boolean
  bodyJson: string
}

export function normalizeArticleBodyJson(bodyJson: string | null | undefined) {
  const fallback = JSON.stringify(tiptapEmptyDocument)
  const trimmed = bodyJson?.trim() ?? ""
  if (!trimmed) return fallback

  try {
    const parsed = JSON.parse(trimmed) as { type?: string }
    return parsed?.type === "doc" ? trimmed : fallback
  } catch {
    return fallback
  }
}

/** Canonical string used to decide whether the server already has these exact fields. */
export function buildArticleSnapshot(input: ArticleFields): string {
  return JSON.stringify({
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    categoryIds: [...new Set(input.categoryIds)].sort(),
    isPublished: input.isPublished,
    isMemberOnly: input.isMemberOnly,
    bodyJson: normalizeArticleBodyJson(input.bodyJson),
  })
}
