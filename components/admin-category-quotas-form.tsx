"use client"

import { useState } from "react"

import { updateCategoryQuotasAction } from "@/app/admin/settings/actions"
import { Button } from "@/components/ui/button"
import type { CategoryQuota } from "@/lib/db-generation-quota.server"

export function CategoryQuotasForm({ quotas }: { quotas: CategoryQuota[] }) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(quotas.map((q) => [q.id, q.dailyQuota])),
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    const updates = quotas.map((q) => ({ id: q.id, dailyQuota: values[q.id] ?? 0 }))
    const res = await updateCategoryQuotasAction(updates)
    setSaving(false)
    setMessage(res.ok ? "تم الحفظ." : res.error)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <table className="w-full text-right text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-2 font-medium">القسم</th>
            <th className="py-2 font-medium">أُنتج اليوم</th>
            <th className="py-2 font-medium">الحد اليومي</th>
          </tr>
        </thead>
        <tbody>
          {quotas.map((q) => (
            <tr key={q.id} className="border-b border-slate-100">
              <td className="py-2 font-medium text-slate-800">{q.name}</td>
              <td className="py-2 text-slate-600">{q.generatedToday}</td>
              <td className="py-2">
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={values[q.id] ?? 0}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [q.id]: Math.max(0, Number(e.target.value) || 0) }))
                  }
                  className="w-24 rounded-lg border border-slate-300 px-3 py-1 text-center tabular-nums outline-none focus:border-slate-500"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </Button>
        {message ? <span className="text-sm text-slate-600">{message}</span> : null}
      </div>
    </div>
  )
}