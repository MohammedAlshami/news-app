/**
 * عرض تاريخ `YYYY-MM-DD` باللغة العربية (التقويم الميلادي).
 */
const formatter = new Intl.DateTimeFormat("ar-EG", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
})

export function formatArticleDate(isoDate: string) {
  const t = Date.parse(isoDate + "T12:00:00.000Z")
  if (Number.isNaN(t)) {
    return isoDate
  }
  return formatter.format(new Date(t))
}

const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" })

/** "قبل ساعتين" style label; falls back to the calendar date after a week. */
export function formatRelativeAr(iso: string | undefined, now = Date.now()): string {
  const t = iso ? Date.parse(iso) : NaN
  if (Number.isNaN(t)) return ""
  const sec = Math.round((t - now) / 1000)
  const abs = Math.abs(sec)
  if (abs < 60) return "الآن"
  if (abs < 3600) return rtf.format(Math.round(sec / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), "hour")
  if (abs < 7 * 86400) return rtf.format(Math.round(sec / 86400), "day")
  return formatArticleDate(new Date(t).toISOString().slice(0, 10))
}
