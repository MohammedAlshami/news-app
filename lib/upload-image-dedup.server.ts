import "server-only"

import crypto from "node:crypto"
import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { images } from "@/db/schema"
import { putR2Object, isR2Configured } from "@/lib/r2.server"

export async function uploadCoverWithDedup(
  sourceUrl: string,
  ownerId: string,
): Promise<string> {
  if (!sourceUrl || !sourceUrl.startsWith("http")) return sourceUrl

  const db = getDb()

  const existingByUrl = await db
    .select()
    .from(images)
    .where(eq(images.sourceUrl, sourceUrl))
    .limit(1)

  if (existingByUrl.length > 0) {
    await db
      .update(images)
      .set({ usageCount: existingByUrl[0].usageCount + 1, updatedAt: new Date() })
      .where(eq(images.id, existingByUrl[0].id))
    return existingByUrl[0].r2Url
  }

  const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) return sourceUrl

  const buffer = Buffer.from(await res.arrayBuffer())
  const hash = crypto.createHash("sha256").update(buffer).digest("hex")

  const existingByHash = await db
    .select()
    .from(images)
    .where(eq(images.hash, hash))
    .limit(1)

  if (existingByHash.length > 0) {
    await db
      .update(images)
      .set({ usageCount: existingByHash[0].usageCount + 1, updatedAt: new Date() })
      .where(eq(images.id, existingByHash[0].id))
    return existingByHash[0].r2Url
  }

  const contentType = res.headers.get("content-type") || "image/jpeg"
  const ext = contentType.split("/")[1] || "jpg"
  const key = `articles/${ownerId}/cover.${ext}`
  const r2Url = isR2Configured()
    ? await putR2Object({ key, body: buffer, contentType })
    : sourceUrl

  await db.insert(images).values({
    sourceUrl,
    r2Url,
    hash,
    firstUsedAt: new Date(),
    usageCount: 1,
  })

  return r2Url
}
