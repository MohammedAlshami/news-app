import type { Metadata } from "next"

import { getCategoryQuotas } from "@/lib/db-generation-quota.server"
import { CategoryQuotasForm } from "@/components/admin-category-quotas-form"

export const metadata: Metadata = { title: "الإعدادات | إدارة" }

export const dynamic = "force-dynamic"

export default async function AdminSettingsPage() {
  const quotas = await getCategoryQuotas()

  return (
    <div dir="rtl" className="flex-1 p-4 md:p-6 lg:p-8">
      <p className="text-sm font-medium text-muted-foreground">واجهة الإدارة</p>
      <h1 className="text-balance text-2xl font-semibold tracking-tight">الإعدادات</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        حدد عدد المقالات المولّدة يوميًا لكل قسم. يُوزّع مولّد المقالات الحصة على الأقسام
        بالتساوي حتى لا تستهلك الأقسام ذات الحجم الكبير حصة الأقسام الأصغر.
      </p>
      <div className="mt-6 max-w-3xl">
        <CategoryQuotasForm quotas={quotas} />
      </div>
    </div>
  )
}