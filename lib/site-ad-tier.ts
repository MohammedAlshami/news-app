export const SITE_AD_TIER_VALUES = [
  "standard",
  "gold",
  "premium",
  "platinum",
] as const

export type SiteAdTierId = (typeof SITE_AD_TIER_VALUES)[number]

const VALID = new Set<string>(SITE_AD_TIER_VALUES)

/** Normalize DB / legacy values to a known tier. */
export function normalizeSiteAdTier(raw: string | null | undefined): SiteAdTierId {
  if (raw && VALID.has(raw)) {
    return raw as SiteAdTierId
  }
  return "standard"
}
