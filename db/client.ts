import { drizzle as drizzleD1 } from "drizzle-orm/d1"
import { drizzle as drizzleSqliteProxy } from "drizzle-orm/sqlite-proxy"

import * as schema from "./schema"
import { getRuntimeEnv } from "@/lib/cloudflare-runtime-env"

/** Public DB type: sqlite-proxy matches builder types used across the repo; D1 uses the same API. */
export type AppDb = ReturnType<typeof drizzleSqliteProxy<typeof schema>>

const CF_CONTEXT_SYM = Symbol.for("__cloudflare-context__")

/** Same ALS-backed slot OpenNext sets (see `@opennextjs/cloudflare` worker init). */
function getD1FromBindings(): CloudflareEnv["DB"] | undefined {
  if (process.env.NODE_ENV === "development") {
    return undefined
  }
  const slot = (
    globalThis as typeof globalThis & {
      [CF_CONTEXT_SYM]?: { env?: CloudflareEnv }
    }
  )[CF_CONTEXT_SYM]
  const db = slot?.env?.DB
  if (db && typeof db.prepare === "function") {
    return db
  }
  return undefined
}

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

export function getDb(): AppDb {
  const d1 = getD1FromBindings()
  if (d1) {
    return drizzleD1(d1, { schema }) as AppDb
  }
  return drizzleSqliteProxy(runD1Query, { schema })
}
