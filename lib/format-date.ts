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
