import "server-only"

import { desc, eq, like, or, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import { advertiseInquiries } from "@/db/schema"
import type { AdminAdvertiseInquiryListItem } from "@/lib/site-types"

export const ADMIN_PAGE_SIZE = 10

export async function getAdminAdvertiseInquiryListPage(input: {
  page: number
  pageSize?: number
  q?: string
}): Promise<{ rows: AdminAdvertiseInquiryListItem[]; total: number }> {
  const pageSize = input.pageSize ?? ADMIN_PAGE_SIZE
  const page = Math.max(1, input.page)
  const offset = (page - 1) * pageSize
  const db = getDb()

  const filter = input.q
    ? or(
        like(advertiseInquiries.name, `%${input.q}%`),
        like(advertiseInquiries.email, `%${input.q}%`),
        like(advertiseInquiries.message, `%${input.q}%`),
      )
    : undefined

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(advertiseInquiries)
    .where(filter)
  const rows = await db
    .select({
      id: advertiseInquiries.id,
      name: advertiseInquiries.name,
      email: advertiseInquiries.email,
      message: advertiseInquiries.message,
      status: advertiseInquiries.status,
      createdAt: advertiseInquiries.createdAt,
    })
    .from(advertiseInquiries)
    .where(filter)
    .orderBy(desc(advertiseInquiries.createdAt))
    .limit(pageSize)
    .offset(offset)

  return {
    total: Number(total ?? 0),
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      messagePreview: r.message,
      status: r.status,
      date: r.createdAt.toISOString().slice(0, 10),
    })),
  }
}

export async function getAdminAdvertiseInquiryById(
  id: string,
): Promise<typeof advertiseInquiries.$inferSelect | null> {
  const [row] = await getDb()
    .select()
    .from(advertiseInquiries)
    .where(eq(advertiseInquiries.id, id))
    .limit(1)
  return row ?? null
}
