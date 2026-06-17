import { getRuntimeEnv } from "@/lib/cloudflare-runtime-env"

function getRequiredEnv(name: string) {
  const value = getRuntimeEnv(name)
  if (!value) throw new Error(`Missing ${name} in .env.local`)
  return value
}

export async function rawD1Exec(sql: string) {
  const accountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID")
  const databaseId = getRequiredEnv("CLOUDFLARE_DATABASE_ID")
  const token = getRequiredEnv("CLOUDFLARE_D1_TOKEN")
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params: [], method: "run" }),
    },
  )
  if (!res.ok) throw new Error(`D1 exec failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { success?: boolean; errors?: Array<{ message?: string }> }
  if (!data.success) throw new Error(data.errors?.[0]?.message ?? "D1 exec failed")
}

export async function rawD1Query(sql: string) {
  const accountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID")
  const databaseId = getRequiredEnv("CLOUDFLARE_DATABASE_ID")
  const token = getRequiredEnv("CLOUDFLARE_D1_TOKEN")
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params: [], method: "all" }),
    },
  )
  if (!res.ok) throw new Error(`D1 query failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as {
    result?: { results?: { columns: string[]; rows: unknown[][] } }[]
    success?: boolean
    errors?: Array<{ message?: string }>
  }
  if (!data.success) throw new Error(data.errors?.[0]?.message ?? "D1 query failed")
  return data.result?.[0]?.results ?? null
}
