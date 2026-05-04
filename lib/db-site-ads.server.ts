import "server-only"

import { and, desc, eq, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { siteAds } from "@/db/schema"
import type { AdminSiteAdListItem, SiteAdPublic } from "@/lib/site-types"

const tierRank: Record<string, number> = {
  platinum: 0,
  premium: 1,
  gold: 2,
  standard: 3,
}

export const ADMIN_PAGE_SIZE = 10

function sortByTierAndCreatedAt<T extends { tier: string; createdAt: Date }>(
  rows: T[],
) {
  return rows.sort((a, b) => {
    const rank = (tierRank[a.tier] ?? 3) - (tierRank[b.tier] ?? 3)
    if (rank !== 0) return rank
    return b.createdAt.getTime() - a.createdAt.getTime()
  })
}

function rowToPublic(r: {
  id: string
  imageUrl: string | null
  href: string
  name: string
}): SiteAdPublic | null {
  if (!r.imageUrl) return null
  return {
    id: r.id,
    imageUrl: r.imageUrl,
    href: r.href,
    name: r.name,
  }
}

/** Same image URL on multiple rows (e.g. duplicate campaigns) would stack in the UI; keep the first after tier sort. */
function dedupeSiteAdsByImageUrl(ads: SiteAdPublic[]): SiteAdPublic[] {
  const seen = new Set<string>()
  const out: SiteAdPublic[] = []
  for (const ad of ads) {
    if (seen.has(ad.imageUrl)) continue
    seen.add(ad.imageUrl)
    out.push(ad)
  }
  return out
}

export async function getActiveSiteAdsForHome(): Promise<SiteAdPublic[]> {
  const rows = await getDb()
    .select({
      id: siteAds.id,
      imageUrl: siteAds.imageUrl,
      href: siteAds.href,
      name: siteAds.name,
      tier: siteAds.tier,
      createdAt: siteAds.createdAt,
    })
    .from(siteAds)
    .where(
      and(
        eq(siteAds.isActive, true),
        eq(siteAds.showOnHome, true),
      ),
    )
    .orderBy(desc(siteAds.createdAt))

  const publicAds = sortByTierAndCreatedAt(rows)
    .map((r) => rowToPublic(r))
    .filter((x): x is SiteAdPublic => x !== null)

  return dedupeSiteAdsByImageUrl(publicAds)
}

export async function getActiveSiteAdsForArticle(): Promise<SiteAdPublic[]> {
  const rows = await getDb()
    .select({
      id: siteAds.id,
      imageUrl: siteAds.imageUrl,
      href: siteAds.href,
      name: siteAds.name,
      tier: siteAds.tier,
      createdAt: siteAds.createdAt,
    })
    .from(siteAds)
    .where(
      and(
        eq(siteAds.isActive, true),
        eq(siteAds.showOnArticle, true),
      ),
    )
    .orderBy(desc(siteAds.createdAt))

  const publicAds = sortByTierAndCreatedAt(rows)
    .map((r) => rowToPublic(r))
    .filter((x): x is SiteAdPublic => x !== null)

  return dedupeSiteAdsByImageUrl(publicAds)
}

export async function getAdminSiteAdListPage(input: {
  page: number
  pageSize?: number
}): Promise<{ rows: AdminSiteAdListItem[]; total: number }> {
  const pageSize = input.pageSize ?? ADMIN_PAGE_SIZE
  const page = Math.max(1, input.page)
  const offset = (page - 1) * pageSize
  const [{ total }] = await getDb()
    .select({ total: sql<number>`count(*)` })
    .from(siteAds)
  const rows = await getDb()
    .select({
      id: siteAds.id,
      name: siteAds.name,
      imageUrl: siteAds.imageUrl,
      href: siteAds.href,
      showOnHome: siteAds.showOnHome,
      showOnArticle: siteAds.showOnArticle,
      isActive: siteAds.isActive,
      tier: siteAds.tier,
      createdAt: siteAds.createdAt,
    })
    .from(siteAds)
    .orderBy(desc(siteAds.createdAt))
    .limit(pageSize)
    .offset(offset)
  return { rows: sortByTierAndCreatedAt(rows), total: Number(total ?? 0) }
}

export async function getAdminSiteAdList(): Promise<AdminSiteAdListItem[]> {
  const rows = await getDb()
    .select({
      id: siteAds.id,
      name: siteAds.name,
      imageUrl: siteAds.imageUrl,
      href: siteAds.href,
      showOnHome: siteAds.showOnHome,
      showOnArticle: siteAds.showOnArticle,
      isActive: siteAds.isActive,
      tier: siteAds.tier,
      createdAt: siteAds.createdAt,
    })
    .from(siteAds)
    .orderBy(desc(siteAds.createdAt))

  return sortByTierAndCreatedAt(rows)
}

export async function getAdminSiteAdById(id: string) {
  const [row] = await getDb()
    .select()
    .from(siteAds)
    .where(eq(siteAds.id, id))
    .limit(1)
  return row ?? null
}
