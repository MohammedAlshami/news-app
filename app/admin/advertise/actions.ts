"use server"

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
