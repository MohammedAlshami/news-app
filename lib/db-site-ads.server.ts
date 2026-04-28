import "server-only"

import { and, desc, eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { siteAds } from "@/db/schema"
import type { AdminSiteAdListItem, SiteAdPublic } from "@/lib/site-types"

const tierRank: Record<string, number> = {
  platinum: 0,
  premium: 1,
  gold: 2,
  standard: 3,
}

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

  return sortByTierAndCreatedAt(rows)
    .map(({ tier: _tier, createdAt: _createdAt, ...r }) => rowToPublic(r))
    .filter((x): x is SiteAdPublic => x !== null)
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

  return sortByTierAndCreatedAt(rows)
    .map(({ tier: _tier, createdAt: _createdAt, ...r }) => rowToPublic(r))
    .filter((x): x is SiteAdPublic => x !== null)
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
