/** Older scraped rows stored HTML-escaped image URLs (`...&amp;itok=...`); the escaped form 403s on some CDNs. */
export function cleanImageUrl<T extends string | null | undefined>(url: T): T {
  if (typeof url !== "string") return url
  return url.replace(/&amp;/gi, "&").trim() as T
}
