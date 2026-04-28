import {
  ALL_CATEGORIES_ID,
  getCategoryPagePath,
} from "@/lib/site-routes"
import type { SiteCategory } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"

export function newsArticleBackFromCategoryIds(
  categoryIds: string[],
  categories: SiteCategory[],
) {
  const first = categoryIds[0]
  if (first) {
    const cat = categories.find((c) => c.id === first)
    return {
      href: getCategoryPagePath(first),
      label: cat ? ar.backTo(cat.name) : ar.backToSection,
    }
  }
  return {
    href: getCategoryPagePath(ALL_CATEGORIES_ID),
    label: ar.backToAll,
  }
}

export function newsArticleCategoryBylineFromIds(
  categoryIds: string[],
  categories: SiteCategory[],
) {
  const names = categoryIds
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter((n): n is string => n !== undefined)
  if (names.length === 0) {
    return ar.newsBrand
  }
  if (names.length === 1) {
    return names[0]
  }
  if (names.length === 2) {
    return `${names[0]} و${names[1]}`
  }
  return (
    names.slice(0, -1).join("، ") + " و" + names[names.length - 1]
  )
}
