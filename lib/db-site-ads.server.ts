import "server-only"

import { and, desc, eq, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { siteAds } from "@/db/schema"
import type { AdminSiteAdListItem, SiteAdPublic } from "@/lib/site-types"

/** Platinum → … → standard when listing ads. */
const tierRankExpr = sql`(case ${siteAds.tier} when 'platinum' then 0 when 'premium' then 1 when 'gold' then 2 else 3 end)`

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
    })
    .from(siteAds)
    .where(
      and(
        eq(siteAds.isActive, true),
        eq(siteAds.showOnHome, true),
      ),
    )
    .orderBy(tierRankExpr, desc(siteAds.createdAt))

  return rows
    .map((r) => rowToPublic(r))
    .filter((x): x is SiteAdPublic => x !== null)
}

export async function getActiveSiteAdsForArticle(): Promise<SiteAdPublic[]> {
  const rows = await getDb()
    .select({
      id: siteAds.id,
      imageUrl: siteAds.imageUrl,
      href: siteAds.href,
      name: siteAds.name,
    })
    .from(siteAds)
    .where(
      and(
        eq(siteAds.isActive, true),
        eq(siteAds.showOnArticle, true),
      ),
    )
    .orderBy(tierRankExpr, desc(siteAds.createdAt))

  return rows
    .map((r) => rowToPublic(r))
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
    })
    .from(siteAds)
    .orderBy(tierRankExpr, desc(siteAds.createdAt))

  return rows
}

export async function getAdminSiteAdById(id: string) {
  const [row] = await getDb()
    .select()
    .from(siteAds)
    .where(eq(siteAds.id, id))
    .limit(1)
  return row ?? null
}
