/** No `node:fs` — safe to import from Client Components. */

export const ALL_CATEGORIES_ID = "all" as const

const SLUG_SEPARATOR = "---"

export function makeArticleSlug(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
}

export function makeArticleSlugId(id: string, title: string): string {
  const shortId = id.slice(0, 8)
  const slug = makeArticleSlug(title)
  return `${slug}${SLUG_SEPARATOR}${shortId}`
}

export function parseShortId(slugId: string): string | null {
  const parts = slugId.split(SLUG_SEPARATOR)
  const shortId = parts.at(-1)
  if (!shortId || !/^[0-9a-f]{8}$/i.test(shortId)) return null
  return shortId
}

export function getArticlePath(articleId: string, _title?: string) {
  return `/news/${articleId}` as const
}

export function getCategoryPagePath(id: string) {
  return `/category/${id}` as const
}
