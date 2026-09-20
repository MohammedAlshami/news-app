import { getCategoryQuotas } from "@/lib/db-generation-quota.server"
import { CategoryQuotasForm } from "@/components/admin-category-quotas-form"

export const dynamic = "force-dynamic"

export default async function AdminSettingsPage() {
  const quotas = await getCategoryQuotas()

  return (
    <div dir="rtl" className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 md:px-10">
      <h1 className="text-2xl font-bold text-slate-900">الإعدادات</h1>
      <p className="mt-2 text-sm text-slate-600">
        حدد عدد المقالات المولّدة يوميًا لكل قسم. يُوزّع مولّد المقالات الحصة على الأقسام
        بالتساوي حتى لا تستهلك الأقسام ذات الحجم الكبير حصة الأقسام الأصغر.
      </p>
      <div className="mt-6">
        <CategoryQuotasForm quotas={quotas} />
      </div>
    </div>
  )
}