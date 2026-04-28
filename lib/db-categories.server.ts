import "server-only"

import { asc, eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { categories } from "@/db/schema"
import { ALL_CATEGORIES_ID, getCategoryPagePath } from "@/lib/site-routes"
import type { SiteCategory } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"

function rowToSiteCategory(row: typeof categories.$inferSelect): SiteCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
  }
}

export async function getCategories(): Promise<SiteCategory[]> {
  const rows = await getDb()
    .select()
    .from(categories)
    .orderBy(asc(categories.name))
  return rows.map(rowToSiteCategory)
}

export async function getCategoryById(
  id: string,
): Promise<SiteCategory | undefined> {
  const [row] = await getDb()
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1)
  return row ? rowToSiteCategory(row) : undefined
}

export async function getCategoryLabelByPageId(
  pageId: string,
): Promise<string | undefined> {
  if (pageId === ALL_CATEGORIES_ID) {
    return ar.all
  }
  const c = await getCategoryById(pageId)
  return c?.name
}

export type CategoryNavItem = {
  id: string
  label: string
  href: string
}

export async function getCategoryNavItems(): Promise<CategoryNavItem[]> {
  const fromData = await getCategories()
  return [
    {
      id: ALL_CATEGORIES_ID,
      label: ar.all,
      href: getCategoryPagePath(ALL_CATEGORIES_ID),
    },
    ...fromData.map((c) => ({
      id: c.id,
      label: c.name,
      href: getCategoryPagePath(c.id),
    })),
  ]
}

export async function isValidCategoryPageId(value: string): Promise<boolean> {
  if (value === ALL_CATEGORIES_ID) {
    return true
  }
  const c = await getCategoryById(value)
  return c !== undefined
}
