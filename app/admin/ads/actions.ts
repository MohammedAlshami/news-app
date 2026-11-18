"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getDb } from "@/db/client"
import { siteAds } from "@/db/schema"
import { getAdminSiteAdById } from "@/lib/db-site-ads.server"
import { requireAdmin } from "@/lib/admin-guard.server"
import { deleteStoredImageIfR2 } from "@/lib/r2.server"
import { storeUploadedImage } from "@/lib/upload-image.server"
import { isSafeHref } from "@/lib/tiptap-sanitize"
import { ar } from "@/lib/ui-ar"
import { eq } from "drizzle-orm"

function revalidatePublicAds() {
  revalidatePath("/")
  revalidatePath("/admin/ads")
}

export async function createSiteAdAction() {
  await requireAdmin()
  const [row] = await getDb()
    .insert(siteAds)
    .values({ name: "" })
    .returning({ id: siteAds.id })
  if (!row) {
    throw new Error("createSiteAdAction: insert failed")
  }
  redirect(`/admin/ads/${row.id}`)
}

export async function deleteSiteAdAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
  const row = await getAdminSiteAdById(id)
  if (!row) {
    return { ok: false, error: ar.adminSiteAdNotFound }
  }
  if (row.imageUrl) {
    const u = row.imageUrl
    await deleteStoredImageIfR2(u)
  }
  await getDb().delete(siteAds).where(eq(siteAds.id, id))
  revalidatePublicAds()
  return { ok: true }
}

export type UpdateSiteAdInput = {
  id: string
  name: string
  href: string
  showOnHome: boolean
  showOnArticle: boolean
  isActive: boolean
  tier: string
}

const TIER_SET = new Set([
  "standard",
  "gold",
  "premium",
  "platinum",
])

export async function updateSiteAdAction(
  input: UpdateSiteAdInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
  const [existing] = await getDb()
    .select({ id: siteAds.id })
    .from(siteAds)
    .where(eq(siteAds.id, input.id))
    .limit(1)
  if (!existing) {
    return { ok: false, error: ar.adminSiteAdNotFound }
  }

  if (!TIER_SET.has(input.tier)) {
    return { ok: false, error: ar.adminSiteAdInvalidTier }
  }

  let href = input.href.trim()
  if (href === "") {
    href = "#"
  }
  if (href !== "#" && (href.length > 2000 || !isSafeHref(href))) {
    return { ok: false, error: "رابط الإعلان غير صالح." }
  }

  await getDb()
    .update(siteAds)
    .set({
      name: input.name.trim().slice(0, 200),
      href,
      showOnHome: input.showOnHome,
      showOnArticle: input.showOnArticle,
      isActive: input.isActive,
      tier: input.tier,
      updatedAt: new Date(),
    })
    .where(eq(siteAds.id, input.id))

  revalidatePublicAds()
  return { ok: true }
}

export async function uploadSiteAdBannerAction(
  adId: string,
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin()
  const [existing] = await getDb()
    .select({ imageUrl: siteAds.imageUrl })
    .from(siteAds)
    .where(eq(siteAds.id, adId))
    .limit(1)
  if (!existing) {
    return { ok: false, error: ar.adminSiteAdNotFound }
  }

  const stored = await storeUploadedImage(formData.get("file"), `ads/${adId}`)
  if (!stored.ok) return stored

  await getDb()
    .update(siteAds)
    .set({ imageUrl: stored.url, updatedAt: new Date() })
    .where(eq(siteAds.id, adId))

  if (existing.imageUrl && existing.imageUrl !== stored.url) {
    await deleteStoredImageIfR2(existing.imageUrl)
  }

  revalidatePublicAds()
  return { ok: true, url: stored.url }
}

export async function removeSiteAdBannerAction(
  adId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
  const [row] = await getDb()
    .select({ imageUrl: siteAds.imageUrl })
    .from(siteAds)
    .where(eq(siteAds.id, adId))
    .limit(1)
  if (!row) {
    return { ok: false, error: ar.adminSiteAdNotFound }
  }
  if (row.imageUrl) {
    const u = row.imageUrl
    await deleteStoredImageIfR2(u)
  }
  await getDb()
    .update(siteAds)
    .set({ imageUrl: null, updatedAt: new Date() })
    .where(eq(siteAds.id, adId))
  revalidatePublicAds()
  return { ok: true }
}
