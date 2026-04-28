/** No `node:fs` — safe to import from Client Components. */

export const ALL_CATEGORIES_ID = "all" as const

export function getArticlePath(articleId: string) {
  return `/news/${articleId}` as const
}

export function getCategoryPagePath(id: string) {
  return `/category/${id}` as const
}
