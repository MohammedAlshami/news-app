"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/admin-guard.server"
import { updateCategoryQuotas } from "@/lib/db-generation-quota.server"

export async function updateCategoryQuotasAction(
  updates: { id: string; dailyQuota: number }[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      return { ok: false, error: "لا توجد تغييرات." }
    }
    if (
      updates.length > 200 ||
      updates.some((u) => !Number.isFinite(Number(u.dailyQuota)) || Number(u.dailyQuota) > 1000)
    ) {
      return { ok: false, error: "قيم غير صالحة." }
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
    console.error("updateCategoryQuotasAction failed:", err)
    return { ok: false, error: "فشل الحفظ." }
  }
}