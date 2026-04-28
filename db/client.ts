import { drizzle } from "drizzle-orm/sqlite-proxy"

import * as schema from "./schema"
import { getRuntimeEnv } from "@/lib/cloudflare-runtime-env"

type Db = ReturnType<typeof drizzle<typeof schema>>

let _db: Db | undefined

function getRequiredEnv(name: string) {
  const value = getRuntimeEnv(name)
  if (!value) {
    throw new Error(`Missing ${name} in .env.local`)
  }
  return value
}

async function runD1Query(
  sql: string,
  params: unknown[],
  method: "run" | "all" | "values" | "get",
) {
  const accountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID")
  const databaseId = getRequiredEnv("CLOUDFLARE_DATABASE_ID")
  const token = getRequiredEnv("CLOUDFLARE_D1_TOKEN")
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params, method }),
    },
  )

  if (!res.ok) {
    throw new Error(`Cloudflare D1 query failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as {
    result?: { results?: { columns: string[]; rows: unknown[][] } }[]
    success?: boolean
    errors?: Array<{ message?: string }>
  }

  if (!data.success) {
    throw new Error(
      data.errors?.[0]?.message ?? "Cloudflare D1 query failed without details",
    )
  }

  const rows = data.result?.[0]?.results?.rows ?? []
  return { rows }
}

export function getDb() {
  if (_db) return _db
  _db = drizzle(runD1Query, { schema })
  return _db
}
