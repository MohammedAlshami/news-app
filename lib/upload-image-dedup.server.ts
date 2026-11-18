import "server-only"

import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { images } from "@/db/schema"
import { putR2Object } from "@/lib/r2.server"
import { contentHashKey, sha256Hex, validateImageBytes } from "@/lib/upload-sniff"

const MAX_COVER_BYTES = 6 * 1024 * 1024
const FETCH_TIMEOUT_MS = 10_000

/**
 * Downloads a source image into R2. THROWS when the image is unusable (HTTP error, not an image, too big,
 * unreachable) so the caller can try the next source image — it never falls back to a hot-linked URL.
 * Type and extension come from the bytes (magic numbers), the key is content-addressed
 * (`articles/covers/<sha256>.<ext>`) so follow-ups and other topics can never overwrite each other's cover.
 */
export async function uploadCoverWithDedup(sourceUrl: string, _ownerId: string): Promise<string> {
  let parsed: URL
  try {
    parsed = new URL(sourceUrl)
  } catch {
    throw new Error("invalid image url")
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("image url must be http(s)")

  const db = getDb()
  const [byUrl] = await db.select().from(images).where(eq(images.sourceUrl, sourceUrl)).limit(1)
  if (byUrl) {
    await db.update(images).set({ usageCount: byUrl.usageCount + 1, updatedAt: new Date() }).where(eq(images.id, byUrl.id))
    return byUrl.r2Url
  }

  const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: "follow" })
  if (!res.ok) throw new Error(`image fetch failed: HTTP ${res.status}`)
  const declared = Number(res.headers.get("content-length") ?? 0)
  if (declared > MAX_COVER_BYTES) throw new Error("image too large")
  const ct = res.headers.get("content-type") ?? ""
  if (ct && !/^image\//i.test(ct) && !/octet-stream/i.test(ct)) throw new Error(`not an image (${ct.slice(0, 40)})`)

  const bytes = new Uint8Array(await res.arrayBuffer())
  const v = validateImageBytes(bytes, MAX_COVER_BYTES)
  if (!v.ok) throw new Error(`rejected image: ${v.reason}`)

  const hash = await sha256Hex(bytes)
  const [byHash] = await db.select().from(images).where(eq(images.hash, hash)).limit(1)
  if (byHash) {
    await db.update(images).set({ usageCount: byHash.usageCount + 1, updatedAt: new Date() }).where(eq(images.id, byHash.id))
    return byHash.r2Url
  }

  const key = await contentHashKey("articles/covers", bytes, v.image.ext)
  const r2Url = await putR2Object({ key, body: bytes, contentType: v.image.contentType })
  await db.insert(images).values({ sourceUrl, r2Url, hash, firstUsedAt: new Date(), usageCount: 1 }).onConflictDoNothing()
  return r2Url
}
