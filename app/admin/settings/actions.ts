"use server"

import { revalidatePath } from "next/cache"

import { updateCategoryQuotas } from "@/lib/db-generation-quota.server"

export async function updateCategoryQuotasAction(
  updates: { id: string; dailyQuota: number }[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      return { ok: false, error: "لا توجد تغييرات." }
    }
    await updateCategoryQuotas(
      updates.map((u) => ({
        id: String(u.id),
        dailyQuota: Number(u.dailyQuota),
      })),
    )
    revalidatePath("/admin/settings")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "فشل الحفظ." }
  }
}