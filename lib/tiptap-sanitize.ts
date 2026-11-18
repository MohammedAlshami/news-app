/**
 * Pure sanitizer for stored Tiptap/ProseMirror JSON. Applied server-side before saving so a
 * crafted client cannot persist javascript:/data: URLs or oversized documents.
 */

export const MAX_BODY_JSON_BYTES = 500 * 1024
export const MAX_TITLE_LENGTH = 300
export const MAX_EXCERPT_LENGTH = 1000
export const MAX_CATEGORIES = 20

const SAFE_LINK = /^(https?:|mailto:|tel:)/i
const SAFE_IMG = /^(https?:\/\/|\/(?!\/))/i

type Json = Record<string, unknown>

export function isSafeHref(href: unknown): href is string {
  if (typeof href !== "string") return false
  // strip control chars/whitespace that browsers ignore inside schemes ("java\nscript:")
  const t = href.replace(/[\u0000- \u007f-\u009f]/g, "")
  if (SAFE_LINK.test(t)) return true
  // relative / anchor links
  return /^(\/(?!\/)|#)/.test(t)
}

export function isSafeImageSrc(src: unknown): src is string {
  if (typeof src !== "string") return false
  const t = src.replace(/[\u0000- \u007f-\u009f]/g, "")
  return SAFE_IMG.test(t)
}

function sanitizeNode(node: unknown, depth: number): Json | null {
  if (!node || typeof node !== "object" || Array.isArray(node) || depth > 64) return null
  const n = { ...(node as Json) }

  if (Array.isArray(n.marks)) {
    n.marks = (n.marks as unknown[]).flatMap((m) => {
      if (!m || typeof m !== "object") return []
      const mark = m as Json
      if (mark.type === "link") {
        const attrs = (mark.attrs ?? {}) as Json
        if (!isSafeHref(attrs.href)) return []
      }
      return [mark]
    })
  }

  if (n.type === "image" || n.type === "resizableImage") {
    const attrs = (n.attrs ?? {}) as Json
    if (!isSafeImageSrc(attrs.src)) return null
  }

  if (Array.isArray(n.content)) {
    n.content = (n.content as unknown[])
      .map((c) => sanitizeNode(c, depth + 1))
      .filter((c): c is Json => c !== null)
  }
  return n
}

export type SanitizedBody = { ok: true; json: string } | { ok: false; reason: "size" | "parse" | "shape" }

/** Parses, sanitizes and re-serializes a Tiptap document string. Empty string is passed through. */
export function sanitizeTiptapBody(raw: string): SanitizedBody {
  const trimmed = raw.trim()
  if (trimmed === "") return { ok: true, json: "" }
  if (new TextEncoder().encode(trimmed).length > MAX_BODY_JSON_BYTES) return { ok: false, reason: "size" }
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return { ok: false, reason: "parse" }
  }
  if (!parsed || typeof parsed !== "object" || (parsed as Json).type !== "doc") {
    return { ok: false, reason: "shape" }
  }
  const clean = sanitizeNode(parsed, 0)
  if (!clean) return { ok: false, reason: "shape" }
  return { ok: true, json: JSON.stringify(clean) }
}
