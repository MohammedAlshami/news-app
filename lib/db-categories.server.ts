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
    slug: row.slug,
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

export async function getCategoryBySlug(
  slug: string,
): Promise<SiteCategory | undefined> {
  const [row] = await getDb()
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1)
  return row ? rowToSiteCategory(row) : undefined
}

export async function getCategoryByPageId(
  pageId: string,
): Promise<SiteCategory | undefined> {
  if (pageId === ALL_CATEGORIES_ID) return undefined
  return (await getCategoryBySlug(pageId)) ?? (await getCategoryById(pageId))
}

export async function getCategoryLabelByPageId(
  pageId: string,
): Promise<string | undefined> {
  if (pageId === ALL_CATEGORIES_ID) {
    return ar.all
  }
  const c = await getCategoryByPageId(pageId)
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
      id: c.slug,
      label: c.name,
      href: getCategoryPagePath(c.slug),
    })),
  ]
}

export async function isValidCategoryPageId(value: string): Promise<boolean> {
  if (value === ALL_CATEGORIES_ID) {
    return true
  }
  const c = await getCategoryByPageId(value)
  return c !== undefined
}
