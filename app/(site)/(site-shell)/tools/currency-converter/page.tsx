import type { Metadata } from "next"
import Link from "next/link"

import { CurrencyConverter } from "@/components/currency-converter"
import { getGoldRates, getMarketRates, type RateLine } from "@/lib/db-price-rates.server"
import { LABELS } from "@/lib/currency-converter-data"
import { ar } from "@/lib/ui-ar"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: ar.currencyConverterMetaTitle,
  description: ar.currencyConverterMetaDescription,
}

const MAIN = ["USD", "SAR", "EUR", "AED", "GBP", "KWD"]
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 })

function RatesCard({ title, lines, buySell = true }: { title: string; lines: RateLine[]; buySell?: boolean }) {
  if (lines.length === 0) return null
  return (
    <div className="rounded-[2rem] bg-neutral-100 p-5 md:p-6">
      <h2 className="mb-3 text-right text-lg font-extrabold text-black">{title}</h2>
      <ul className="space-y-1">
        {lines.map((l) => (
          <li key={l.code} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm">
            <span className="font-bold text-neutral-900">{LABELS[l.code] ?? l.name}</span>
            <span className="text-left tabular-nums">
              <span className="font-extrabold text-black">{fmt(l.sell)}</span>
              {buySell ? <span className="mr-2 text-xs text-neutral-400">{fmt(l.buy)}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default async function CurrencyConverterPage() {
  const [sanaa, aden, gold] = await Promise.all([
    getMarketRates("sanaa").catch(() => []),
    getMarketRates("aden").catch(() => []),
    getGoldRates().catch(() => []),
  ])
  const main = (l: RateLine[]) => MAIN.flatMap((c) => l.filter((x) => x.code === c))
  return (
    <section dir="rtl" lang="ar" className="bg-white">
      <div className="mx-auto w-full max-w-[90rem] px-4 pb-10 pt-6 sm:px-6 md:px-12 md:pb-16 md:pt-10">
        <nav className="mb-6 text-sm text-neutral-500" aria-label="مسار التنقل">
          <Link href="/" className="hover:text-neutral-900">
            {ar.home}
          </Link>
          <span className="mx-2 text-neutral-300">/</span>
          <span className="font-medium text-neutral-900">{ar.currencyConverterTitle}</span>
        </nav>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <CurrencyConverter />
          <aside className="space-y-4">
            <RatesCard title="سعر الصرف في صنعاء" lines={main(sanaa)} />
            <RatesCard title="سعر الصرف في عدن" lines={main(aden)} />
            <RatesCard title="الذهب" lines={gold} />
            <p className="px-2 text-xs leading-6 text-neutral-400">الرقم الكبير هو سعر البيع، والصغير سعر الشراء، بالريال اليمني.</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
