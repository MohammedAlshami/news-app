"use server"

import { mkdir, unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getDb } from "@/db/client"
import { siteAds } from "@/db/schema"
import { getAdminSiteAdById } from "@/lib/db-site-ads.server"
import {
  deleteStoredImageIfR2,
  isR2Configured,
  putR2Object,
} from "@/lib/r2.server"
import { ar } from "@/lib/ui-ar"
import { eq } from "drizzle-orm"

const imageMimeToExt: Record<string, "jpg" | "png" | "webp" | "gif"> = {
  "image/jpeg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

function revalidatePublicAds() {
  revalidatePath("/")
  revalidatePath("/admin/ads")
}

export async function createSiteAdAction() {
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
  const row = await getAdminSiteAdById(id)
  if (!row) {
    return { ok: false, error: ar.adminSiteAdNotFound }
  }
  if (row.imageUrl) {
    const u = row.imageUrl
    if (u.startsWith("/")) {
      const abs = join(process.cwd(), "public", u)
      try {
        await unlink(abs)
      } catch {
        // ignore
      }
    } else {
      await deleteStoredImageIfR2(u)
    }
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

  await getDb()
    .update(siteAds)
    .set({
      name: input.name.trim(),
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
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: ar.adminSiteAdNoFile }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: ar.adminSiteAdImageTooBig }
  }

  const fromMime = imageMimeToExt[file.type]
  const finalExt =
    fromMime ||
    (() => {
      const raw = (file.name.split(".").pop() || "").toLowerCase()
      if (raw === "jpeg" || raw === "jpg") return "jpg" as const
      if (raw === "png" || raw === "webp" || raw === "gif") return raw
      return null
    })()
  if (!finalExt) {
    return { ok: false, error: ar.adminSiteAdImageType }
  }

  const [existing] = await getDb()
    .select({ imageUrl: siteAds.imageUrl })
    .from(siteAds)
    .where(eq(siteAds.id, adId))
    .limit(1)
  if (!existing) {
    return { ok: false, error: ar.adminSiteAdNotFound }
  }

  if (existing.imageUrl) {
    const prev = existing.imageUrl
    if (prev.startsWith("/")) {
      const abs = join(process.cwd(), "public", prev)
      try {
        await unlink(abs)
      } catch {
        // ignore
      }
    } else {
      await deleteStoredImageIfR2(prev)
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const contentType =
    file.type ||
    (finalExt === "jpg" ? "image/jpeg" : `image/${finalExt}`)
  const filename = `banner.${finalExt}`

  let publicUrl: string
  if (isR2Configured()) {
    const key = `ads/${adId}/${filename}`
    publicUrl = await putR2Object({
      key,
      body: buffer,
      contentType,
    })
  } else {
    const dir = join(process.cwd(), "public", "uploads", "ads", adId)
    await mkdir(dir, { recursive: true })
    const outPath = join(dir, filename)
    await writeFile(outPath, buffer)
    publicUrl = `/uploads/ads/${adId}/${filename}`
  }

  await getDb()
    .update(siteAds)
    .set({
      imageUrl: publicUrl,
      updatedAt: new Date(),
    })
    .where(eq(siteAds.id, adId))

  revalidatePublicAds()
  return { ok: true, url: publicUrl }
}

export async function removeSiteAdBannerAction(
  adId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
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
    if (u.startsWith("/")) {
      const abs = join(process.cwd(), "public", u)
      try {
        await unlink(abs)
      } catch {
        // ignore
      }
    } else {
      await deleteStoredImageIfR2(u)
    }
  }
  await getDb()
    .update(siteAds)
    .set({ imageUrl: null, updatedAt: new Date() })
    .where(eq(siteAds.id, adId))
  revalidatePublicAds()
  return { ok: true }
}
