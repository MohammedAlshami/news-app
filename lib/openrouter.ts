export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
export const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-v4-flash"
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ""

/**
 * Force OpenRouter to route to the cheapest upstream provider.
 * `deepseek/deepseek-v4-flash` is served by many providers at very different
 * prices (StreamLake/Baidu $0.036 vs Azure $0.210 per 1M input).
 */
export const OPENROUTER_PROVIDER = { sort: "price" } as const