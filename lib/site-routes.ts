/** No `node:fs` — safe to import from Client Components. */

export const ALL_CATEGORIES_ID = "all" as const

const SLUG_SEPARATOR = "---"

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
