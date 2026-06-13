"use server"

import { revalidatePath } from "next/cache"

import { getDb } from "@/db/client"
import { advertiseInquiries } from "@/db/schema"
import { ar } from "@/lib/ui-ar"
import { eq } from "drizzle-orm"

const MAX_NAME = 200
const MAX_EMAIL = 320
const MAX_PHONE = 40
const MAX_COMPANY = 200
const MAX_MESSAGE = 8000

function normalizeEmail(s: string): string {
  return s.trim().toLowerCase()
}

export async function submitAdvertiseInquiryAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = String(formData.get("name") ?? "").trim()
  const email = normalizeEmail(String(formData.get("email") ?? ""))
  const phone = String(formData.get("phone") ?? "").trim() || null
  const company = String(formData.get("company") ?? "").trim() || null
  const message = String(formData.get("message") ?? "").trim()

  if (!name) {
    return { ok: false, error: ar.advertiseErrorName }
  }
  if (name.length > MAX_NAME) {
    return { ok: false, error: ar.advertiseErrorNameLong }
  }
  if (!email || !email.includes("@")) {
    return { ok: false, error: ar.advertiseErrorEmail }
  }
  if (email.length > MAX_EMAIL) {
    return { ok: false, error: ar.advertiseErrorEmailLong }
  }
  if (phone && phone.length > MAX_PHONE) {
    return { ok: false, error: ar.advertiseErrorPhoneLong }
  }
  if (company && company.length > MAX_COMPANY) {
    return { ok: false, error: ar.advertiseErrorCompanyLong }
  }
  if (!message) {
    return { ok: false, error: ar.advertiseErrorMessage }
  }
  if (message.length > MAX_MESSAGE) {
    return { ok: false, error: ar.advertiseErrorMessageLong }
  }

  try {
    await getDb().insert(advertiseInquiries).values({
      name,
      email,
      phone,
      company,
      message,
      status: "new",
    })
  } catch (err) {
    console.error("Failed to insert advertise inquiry:", err)
    return { ok: false, error: "تعذر حفظ الطلب حالياً. حاول مرة أخرى." }
  }

  revalidatePath("/admin/advertise")
  return { ok: true }
}
