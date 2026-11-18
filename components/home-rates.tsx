import Link from "next/link"
import { ArrowLeftRight } from "lucide-react"

import { formatRelativeAr } from "@/lib/format-date"
import type { HomeRates, RateLine } from "@/lib/db-price-rates.server"

const WRAP = "mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8 xl:px-8 2xl:px-10"
const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 })

function MarketCard({ title, lines }: { title: string; lines: RateLine[] }) {
  return (
    <div className="rounded-3xl bg-white p-5 md:p-7">
      <h3 className="mb-4 text-right text-xl font-extrabold text-neutral-900">{title}</h3>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-3.5 text-right md:gap-x-10">
        <span className="text-xs font-bold text-neutral-400">العملة</span>
        <span className="w-16 text-center text-xs font-bold text-neutral-400">شراء</span>
        <span className="w-16 text-center text-xs font-bold text-neutral-400">بيع</span>
        {lines.map((l) => (
          <div key={l.code} className="contents">
            <span className="text-[15px] font-bold text-neutral-900">{l.name}</span>
            <span className="w-16 text-center text-[15px] font-extrabold tabular-nums text-neutral-700">{num(l.buy)}</span>
            <span className="w-16 text-center text-[15px] font-extrabold tabular-nums text-black">{num(l.sell)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** «أسعار العملات في اليمن»: Sana'a and Aden side by side, plus the converter button. */
export function HomeRatesSection({ rates, converterHref, compact = false }: { rates: HomeRates; converterHref: string; compact?: boolean }) {
  if (rates.sanaa.length === 0 && rates.aden.length === 0) return null
  return (
    <section dir="rtl" lang="ar" aria-labelledby="home-rates" className={compact ? "py-6 md:py-8" : "py-6 md:py-10"}>
      <div className={WRAP}>
        <div className="rounded-[2rem] bg-neutral-100 px-5 py-8 md:px-10 md:py-12">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4 md:mb-9">
            <div>
              <h2 id="home-rates" className="text-pretty text-right text-2xl font-bold tracking-tight text-black md:text-3xl">
                أسعار العملات في اليمن
              </h2>
              {rates.updatedAt ? (
                <p className="mt-2 text-sm text-neutral-500">آخر تحديث {formatRelativeAr(new Date(rates.updatedAt).toISOString())}</p>
              ) : null}
            </div>
            <Link
              href={converterHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-extrabold text-white transition-colors hover:bg-neutral-800 sm:w-auto"
            >
              <ArrowLeftRight className="h-4 w-4" aria-hidden />
              حوّل العملات
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {rates.sanaa.length ? <MarketCard title="صنعاء" lines={rates.sanaa} /> : null}
            {rates.aden.length ? <MarketCard title="عدن" lines={rates.aden} /> : null}
          </div>
          <p className="mt-5 text-right text-xs text-neutral-400">الأسعار بالريال اليمني للوحدة الواحدة، وهي إرشادية وتختلف بين الصرافين.</p>
        </div>
      </div>
    </section>
  )
}
