"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { getDb } from "@/db/client"
import { advertiseInquiries } from "@/db/schema"
import { requireAdmin } from "@/lib/admin-guard.server"
import { getAdminAdvertiseInquiryById } from "@/lib/db-advertise-inquiries.server"
import { ar } from "@/lib/ui-ar"

export type AdminAdvertiseInquiryPayload = {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  message: string
  status: string
  adminNotes: string | null
  createdAtIso: string
  updatedAtIso: string
}

export async function getAdminAdvertiseInquiryAction(
  id: string,
): Promise<
  | { ok: true; data: AdminAdvertiseInquiryPayload }
  | { ok: false; error: string }
> {
  await requireAdmin()
  const row = await getAdminAdvertiseInquiryById(id)
  if (!row) {
    return { ok: false, error: ar.adminAdvertiseNotFound }
  }
  return {
    ok: true,
    data: {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      message: row.message,
      status: row.status,
      adminNotes: row.adminNotes,
      createdAtIso: row.createdAt.toISOString(),
      updatedAtIso: row.updatedAt.toISOString(),
    },
  }
}

const STATUSES = new Set(["new", "read", "archived"])

/** Sets the workflow status and the internal notes of an advertising request. */
export async function updateAdvertiseInquiryAction(
  id: string,
  status: string,
  adminNotes: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
  if (!STATUSES.has(status)) return { ok: false, error: "حالة غير صالحة." }
  const notes = adminNotes.trim().slice(0, 4000)
  const res = await getDb()
    .update(advertiseInquiries)
    .set({ status, adminNotes: notes || null, updatedAt: new Date() })
    .where(eq(advertiseInquiries.id, id))
    .returning({ id: advertiseInquiries.id })
  if (res.length === 0) return { ok: false, error: ar.adminAdvertiseNotFound }
  revalidatePath("/admin/advertise")
  revalidatePath(`/admin/advertise/${id}`)
  return { ok: true }
}
