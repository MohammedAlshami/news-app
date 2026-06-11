import "server-only"

import { and, desc, eq, like, or, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { users } from "@/db/schema"
import type { AdminUserListItem } from "@/lib/site-types"

export const ADMIN_PAGE_SIZE = 10

export async function getAdminUserListPage(input: {
  page: number
  pageSize?: number
  role?: string
  q?: string
}): Promise<{ rows: AdminUserListItem[]; total: number }> {
  const pageSize = input.pageSize ?? ADMIN_PAGE_SIZE
  const page = Math.max(1, input.page)
  const offset = (page - 1) * pageSize

  const db = getDb()

  const whereClauses = []
  if (input.role) whereClauses.push(eq(users.role, input.role))
  if (input.q) {
    whereClauses.push(or(like(users.email, `%${input.q}%`), like(users.name, `%${input.q}%`)))
  }

  const filter = whereClauses.length > 0 ? and(...whereClauses) : undefined

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(users)
    .where(filter)

  const rows = await db
    .select()
    .from(users)
    .where(filter)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset)

  return {
    total: Number(total ?? 0),
    rows: rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      createdAt: r.createdAt.toISOString().slice(0, 10),
    })),
  }
}
