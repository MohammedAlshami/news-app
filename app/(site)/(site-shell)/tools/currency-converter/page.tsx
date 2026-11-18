import type { Metadata } from "next"
import Link from "next/link"

import { CurrencyConverter } from "@/components/currency-converter"
import { RatesColumns } from "@/components/rates-columns"
import { getGoldRates, getMarketRates } from "@/lib/db-price-rates.server"
import { ar } from "@/lib/ui-ar"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: ar.currencyConverterMetaTitle,
  description: ar.currencyConverterMetaDescription,
}

export default async function CurrencyConverterPage() {
  const [sanaa, aden, gold] = await Promise.all([
    getMarketRates("sanaa").catch(() => []),
    getMarketRates("aden").catch(() => []),
    getGoldRates().catch(() => []),
  ])
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
        <div className="mt-14">
          <RatesColumns sanaa={sanaa} aden={aden} gold={gold} />
        </div>
        <p className="mt-10 text-sm text-neutral-400">الأسعار بالريال اليمني، الرقم الكبير سعر البيع والصغير سعر الشراء.</p>
      </div>
    </section>
  )
}
