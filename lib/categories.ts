/** Path helpers: safe for Client Components (no `node:fs`). */
export { ALL_CATEGORIES_ID, getCategoryPagePath } from "./site-routes"
export type { SiteCategory } from "./site-types"
export type { CategoryNavItem } from "./db-categories.server"
export {
  getCategories,
  getCategoryById,
  getCategoryLabelByPageId,
  getCategoryNavItems,
  isValidCategoryPageId,
} from "./db-categories.server"
