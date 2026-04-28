import "server-only"

import { desc, eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { advertiseInquiries } from "@/db/schema"
import type { AdminAdvertiseInquiryListItem } from "@/lib/site-types"

export async function getAdminAdvertiseInquiryList(): Promise<
  AdminAdvertiseInquiryListItem[]
> {
  const rows = await getDb()
    .select({
      id: advertiseInquiries.id,
      name: advertiseInquiries.name,
      email: advertiseInquiries.email,
      message: advertiseInquiries.message,
      status: advertiseInquiries.status,
      createdAt: advertiseInquiries.createdAt,
    })
    .from(advertiseInquiries)
    .orderBy(desc(advertiseInquiries.createdAt))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    messagePreview: r.message,
    status: r.status,
    date: r.createdAt.toISOString().slice(0, 10),
  }))
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
