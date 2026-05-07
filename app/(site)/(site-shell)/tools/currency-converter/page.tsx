import type { Metadata } from "next"

import { CurrencyConverter } from "@/components/currency-converter"
import { LABELS, PRICING_ROWS } from "@/lib/currency-converter-data"
import { ar } from "@/lib/ui-ar"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: ar.currencyConverterMetaTitle,
  description: ar.currencyConverterMetaDescription,
}

export default function CurrencyConverterPage() {
  return (
    <section dir="rtl" lang="ar" className="bg-white">
      <div className="mx-auto mt-8 max-w-[90rem] px-6 pb-8 pt-16 md:mt-10 md:px-12 md:pb-12 md:pt-20">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <CurrencyConverter />
          <aside className="space-y-3">
            <div className="rounded-[1.75rem] border border-gray-200 bg-white p-4">
              <div className="mb-3 text-sm font-bold text-gray-500">سعر الريال في صنعاء</div>
              {PRICING_ROWS.map((row) => (
                <div key={`sanaa-${row.code}`} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-bold text-gray-900">{LABELS[row.code] ?? row.code}</span>
                  <span className="text-gray-500">{row.sanaa}</span>
                </div>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-gray-200 bg-white p-4">
              <div className="mb-3 text-sm font-bold text-gray-500">سعر الريال في عدن</div>
              {PRICING_ROWS.map((row) => (
                <div key={`aden-${row.code}`} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-bold text-gray-900">{LABELS[row.code] ?? row.code}</span>
                  <span className="text-gray-500">{row.aden}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
