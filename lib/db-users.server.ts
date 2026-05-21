import "server-only"

import { desc, eq, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { users } from "@/db/schema"
import type { AdminUserListItem } from "@/lib/site-types"

export const ADMIN_PAGE_SIZE = 10

export async function getAdminUserListPage(input: {
  page: number
  pageSize?: number
  role?: string
}): Promise<{ rows: AdminUserListItem[]; total: number }> {
  const pageSize = input.pageSize ?? ADMIN_PAGE_SIZE
  const page = Math.max(1, input.page)
  const offset = (page - 1) * pageSize

  const db = getDb()
  const base = input.role
    ? db.select().from(users).where(eq(users.role, input.role))
    : db.select().from(users)

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(users)
    .$dynamic()

  const rows = await base
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
