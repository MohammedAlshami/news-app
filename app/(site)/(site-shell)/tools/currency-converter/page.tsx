import type { Metadata } from "next"
import Link from "next/link"

import { CurrencyConverter } from "@/components/currency-converter"
import { getGoldRates, getMarketRates, type RateLine } from "@/lib/db-price-rates.server"
import { LABELS, SYMBOLS } from "@/lib/currency-converter-data"
import { ar } from "@/lib/ui-ar"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: ar.currencyConverterMetaTitle,
  description: ar.currencyConverterMetaDescription,
}

const MAIN = ["USD", "SAR", "EUR", "AED", "GBP", "KWD"]
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 })

const TONES = {
  amber: { dot: "bg-amber-400", badge: "bg-amber-400 text-neutral-900" },
  blue: { dot: "bg-blue-600", badge: "bg-blue-600 text-white" },
  yellow: { dot: "bg-yellow-500", badge: "bg-yellow-500 text-neutral-900" },
} as const

function RatesColumn({ title, lines, tone }: { title: string; lines: RateLine[]; tone: keyof typeof TONES }) {
  if (lines.length === 0) return null
  const t = TONES[tone]
  return (
    <div>
      <h2 className="mb-5 flex items-center gap-3 text-2xl font-extrabold text-black">
        <span className={`h-4 w-4 rounded-full ${t.dot}`} aria-hidden />
        {title}
      </h2>
      <ul className="space-y-4">
        {lines.map((l) => (
          <li key={l.code} className="flex items-center gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black ${t.badge}`}>{SYMBOLS[l.code] ?? l.name.slice(0, 1)}</span>
            <span className="min-w-0 flex-1 truncate text-base font-bold text-neutral-800">{LABELS[l.code] ?? l.name}</span>
            <span className="text-left tabular-nums">
              <span className="block text-2xl font-black text-black">{fmt(l.sell)}</span>
              <span className="block text-xs font-bold text-neutral-400">شراء {fmt(l.buy)}</span>
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
        <CurrencyConverter />
        <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
          <RatesColumn title="صنعاء" lines={main(sanaa)} tone="amber" />
          <RatesColumn title="عدن" lines={main(aden)} tone="blue" />
          <RatesColumn title="الذهب" lines={gold} tone="yellow" />
        </div>
        <p className="mt-10 text-sm text-neutral-400">الأسعار بالريال اليمني، الرقم الكبير سعر البيع والصغير سعر الشراء.</p>
      </div>
    </section>
  )
}
