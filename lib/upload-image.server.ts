import "server-only"

import { putR2Object } from "@/lib/r2.server"
import { contentHashKey, MAX_UPLOAD_BYTES, validateImageBytes } from "@/lib/upload-sniff"

export type StoreImageResult = { ok: true; url: string } | { ok: false; error: string }

const ERR_NO_FILE = "لم يُرسل ملف."
const ERR_TOO_BIG = "الحجم بحد أقصى 5 ميغابايت."
const ERR_TYPE = "يُقبل فقط صورة (JPEG, PNG, WebP, GIF, AVIF)."

/**
 * Validates an uploaded image by magic bytes (ignoring client-supplied type/name) and stores it in R2
 * under a content-hash key: `<prefix>/<sha256-32>.<ext>`.
 */
export async function storeUploadedImage(file: unknown, prefix: string): Promise<StoreImageResult> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: ERR_NO_FILE }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: ERR_TOO_BIG }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const v = validateImageBytes(bytes)
  if (!v.ok) return { ok: false, error: v.reason === "too_big" ? ERR_TOO_BIG : v.reason === "empty" ? ERR_NO_FILE : ERR_TYPE }
  const key = await contentHashKey(prefix, bytes, v.image.ext)
  const url = await putR2Object({ key, body: bytes, contentType: v.image.contentType })
  return { ok: true, url }
}
