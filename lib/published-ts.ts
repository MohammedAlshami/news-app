/**
 * Parse the many `published_at` shapes scrapers produce into epoch ms.
 *  - ISO: `2026-08-14T01:00:55.624Z`, `...+03:00`, `...+0300`
 *  - Arabic-Indic digits: `٢٠٢٦-٠٧-١٧T١٤:٢٤:٤٩+0400`
 *  - Al-Independent: `سبت, 08/01/2026 - 07:30` (MM/DD/YYYY, local Arabia time, UTC+3)
 *  - Al-Watan: `9/8/2026 9:30:50 AM` (M/D/YYYY, local Egypt/Arabia time, ~UTC+3)
 * Returns null when nothing usable was found. Future dates are clamped to `now`.
 */
const LOCAL_OFFSET_MIN = 3 * 60

function toAsciiDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
}

export function parsePublishedTs(raw: string | null | undefined, now = Date.now()): number | null {
  if (!raw) return null
  const s = toAsciiDigits(raw.trim())
  if (!s) return null

  let ts: number | null = null

  // ISO-ish
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?\s*(Z|[+-]\d{2}:?\d{2})?$/i)
  if (iso) {
    const [, y, mo, d, h, mi, sec, frac, tz] = iso
    let offsetMin = 0
    if (tz && tz.toUpperCase() !== "Z") {
      const sign = tz.startsWith("-") ? -1 : 1
      const digits = tz.slice(1).replace(":", "")
      offsetMin = sign * (+digits.slice(0, 2) * 60 + +digits.slice(2, 4))
    } else if (!tz) {
      offsetMin = LOCAL_OFFSET_MIN
    }
    ts = Date.UTC(+y, +mo - 1, +d, +h, +mi, +(sec ?? 0), frac ? +frac.slice(0, 3).padEnd(3, "0") : 0) - offsetMin * 60000
  }

  // "سبت, 08/01/2026 - 07:30"
  if (ts === null) {
    const ar = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*-\s*(\d{1,2}):(\d{2})/)
    if (ar) {
      const [, a, b, y, h, mi] = ar
      ts = Date.UTC(+y, +a - 1, +b, +h, +mi) - LOCAL_OFFSET_MIN * 60000
    }
  }

  // "9/8/2026 9:30:50 AM"
  if (ts === null) {
    const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i)
    if (us) {
      const [, a, b, y, h, mi, sec, ap] = us
      let hour = +h % 12
      if (ap.toUpperCase() === "PM") hour += 12
      ts = Date.UTC(+y, +a - 1, +b, hour, +mi, +(sec ?? 0)) - LOCAL_OFFSET_MIN * 60000
    }
  }

  // Last resort: whatever Date understands
  if (ts === null) {
    const t = Date.parse(s)
    if (!Number.isNaN(t)) ts = t
  }

  if (ts === null || Number.isNaN(ts)) return null
  if (ts > now) ts = now
  return ts
}
