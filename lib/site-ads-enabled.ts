/**
 * Site-wide ad surfaces respect `SHOW_ADS` or `show_ads`.
 * Set to `0` (or `false`) to hide ads. When unset, ads are shown (existing behavior).
 */
export function areSiteAdsEnabled(): boolean {
  const raw = process.env.SHOW_ADS ?? process.env.show_ads
  if (raw === undefined || raw === "") return true
  const v = String(raw).trim().toLowerCase()
  return !(v === "0" || v === "false" || v === "no" || v === "off")
}
