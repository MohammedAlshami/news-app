/** Source-native category → site category slug (`mixed` = ambiguous, needs classification). */
export const SOURCE_TO_SITE_CATEGORY: Record<string, string> = {
  business: "economy", economy: "economy", finance: "economy",
  sport: "sports", sports: "sports",
  tech: "technology", technology: "technology",
  politics: "politics",
  health: "health",
  culture: "culture", arts: "culture", art: "culture",
  science: "science",
  environment: "environment", climate: "environment",
  russia: "politics", press: "politics",
  docfilms: "culture",
  satelites: "science",
}

export const SITE_CATEGORY_HINTS: Record<string, string> = {
  economy: "business, finance, markets, trade, money, prices of gold/currency/commodities",
  sports: "sports, athletics, matches, tournaments, football transfers",
  technology: "tech, AI, gadgets, software, internet",
  politics: "politics, diplomacy, government, international relations, conflicts, war, elections",
  health: "health, medicine, diseases, nutrition",
  culture: "arts, cinema, music, literature, theater, celebrities",
  science: "science, space, research, discoveries",
  environment: "environment, climate, weather, nature, water, agriculture",
}

/** Direct mapping for a source category, or null when it is ambiguous ("world", "news", …). */
export function directSiteCategory(sourceCategory: string): string | null {
  return SOURCE_TO_SITE_CATEGORY[(sourceCategory ?? "").toLowerCase().trim()] ?? null
}
