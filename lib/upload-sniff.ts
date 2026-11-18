/**
 * Pure helpers for validating uploaded images. Never trust `File.type` or the file name:
 * the type and extension are derived from the file's magic bytes. SVG/HTML/etc. are rejected.
 */

export type SniffedImage = {
  ext: "jpg" | "png" | "webp" | "gif" | "avif"
  contentType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "image/avif"
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function ascii(b: Uint8Array, start: number, len: number): string {
  let s = ""
  for (let i = start; i < start + len && i < b.length; i++) s += String.fromCharCode(b[i])
  return s
}

export function sniffImage(bytes: Uint8Array): SniffedImage | null {
  if (bytes.length < 12) return null
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: "jpg", contentType: "image/jpeg" }
  }
  if (
    bytes[0] === 0x89 &&
    ascii(bytes, 1, 3) === "PNG" &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { ext: "png", contentType: "image/png" }
  }
  const g = ascii(bytes, 0, 6)
  if (g === "GIF87a" || g === "GIF89a") return { ext: "gif", contentType: "image/gif" }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return { ext: "webp", contentType: "image/webp" }
  }
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4)
    if (brand === "avif" || brand === "avis") return { ext: "avif", contentType: "image/avif" }
  }
  return null
}

export type ImageValidation =
  | { ok: true; image: SniffedImage }
  | { ok: false; reason: "empty" | "too_big" | "type" }

export function validateImageBytes(
  bytes: Uint8Array,
  maxBytes: number = MAX_UPLOAD_BYTES,
): ImageValidation {
  if (bytes.length === 0) return { ok: false, reason: "empty" }
  if (bytes.length > maxBytes) return { ok: false, reason: "too_big" }
  const image = sniffImage(bytes)
  return image ? { ok: true, image } : { ok: false, reason: "type" }
}

/** Hex SHA-256 of the bytes (Web Crypto; available in Workers and Node). */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource)
  return Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, "0")).join("")
}

/** Content-addressed key: identical bytes map to the same immutable object. */
export async function contentHashKey(prefix: string, bytes: Uint8Array, ext: string): Promise<string> {
  const hash = (await sha256Hex(bytes)).slice(0, 32)
  return `${prefix.replace(/\/+$/, "")}/${hash}.${ext}`
}
