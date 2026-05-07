type CloudflareContext = {
  env?: Record<string, unknown>
} | null

function readCloudflareContext(): CloudflareContext {
  return (globalThis as typeof globalThis & {
    [key: symbol]: CloudflareContext
  })[Symbol.for("__cloudflare-context__")] ?? null
}

export function getRuntimeEnv(name: string): string | undefined {
  if (process.env.NODE_ENV === "development") {
    return process.env[name]
  }
  const cloudflareEnv = readCloudflareContext()?.env
  const value = cloudflareEnv?.[name]
  if (typeof value === "string" && value.length > 0) {
    return value
  }

  const processValue = process.env[name]
  if (typeof processValue === "string" && processValue.length > 0) {
    return processValue
  }

  return undefined
}
