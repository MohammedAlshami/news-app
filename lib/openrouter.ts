export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
export const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-v4-flash"
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ""