import Link from "next/link"
import { ArrowLeftRight, Clock, TrendingUp } from "lucide-react"

import type { HomeRates } from "@/lib/db-price-rates.server"
import { formatRelativeAr } from "@/lib/format-date"

const WRAP = "mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8 xl:px-8 2xl:px-10"
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 })

type Usd = { sanaa: { buy: number; sell: number }; aden: { buy: number; sell: number }; updated: string | null }

export function usdFrom(rates: HomeRates): Usd | null {
  const s = rates.sanaa.find((r) => r.code === "USD")
  const a = rates.aden.find((r) => r.code === "USD")
  if (!s || !a) return null
  return { sanaa: { buy: s.buy, sell: s.sell }, aden: { buy: a.buy, sell: a.sell }, updated: rates.updatedAt ? new Date(rates.updatedAt).toISOString() : null }
}

function Cta({ href, className = "" }: { href: string; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-extrabold transition-transform hover:scale-[1.03] ${className}`}>
      <ArrowLeftRight className="h-5 w-5" aria-hidden />
      حوّل العملات
    </Link>
  )
}

const Live = ({ iso, cls = "text-white/80" }: { iso: string | null; cls?: string }) =>
  iso ? (
    <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${cls}`}>
      <Clock className="h-4 w-4" aria-hidden />
      محدّث {formatRelativeAr(iso)}
    </span>
  ) : null

/** Dollar price in Sana'a vs Aden, with the gap between them. */
export function HomeUsdRates({ rates, href }: { rates: HomeRates; href: string }) {
  const u = usdFrom(rates)
  if (!u) return null
  const gap = u.aden.sell - u.sanaa.sell
  const pct = u.sanaa.sell > 0 ? Math.round((gap / u.sanaa.sell) * 100) : 0
  return (
    <section dir="rtl" lang="ar" className="py-6 md:py-10">
      <div className={WRAP}>
        <div className="relative">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 pt-10 md:pt-0">
            <h2 className="text-3xl font-extrabold text-black md:text-5xl">الدولار بين صنعاء وعدن</h2>
            <Cta href={href} className="bg-[#0d4a6e] text-white" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            <div className="overflow-hidden rounded-[2rem] bg-[#f4e4c1] p-7 text-[#5a4410] md:p-10">
              <div className="relative text-2xl font-extrabold md:text-3xl">صنعاء</div>
              <div className="relative mt-4 text-7xl font-black tabular-nums md:text-9xl">{fmt(u.sanaa.sell)}</div>
              <div className="relative mt-2 text-xl font-bold">ريال لكل دولار · شراء {fmt(u.sanaa.buy)}</div>
            </div>
            <div className="overflow-hidden rounded-[2rem] bg-[#cfe6ec] p-7 text-[#0d4a6e] md:p-10">
              <div className="relative text-2xl font-extrabold md:text-3xl">عدن</div>
              <div className="relative mt-4 text-7xl font-black tabular-nums md:text-9xl">{fmt(u.aden.sell)}</div>
              <div className="relative mt-2 text-xl font-bold text-[#0d4a6e]/75">ريال لكل دولار · شراء {fmt(u.aden.buy)}</div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 rounded-full bg-neutral-100 px-6 py-4 text-lg font-extrabold text-neutral-800">
            <TrendingUp className="h-6 w-6 text-rose-500" aria-hidden />
            الفرق بين المدينتين {fmt(gap)} ريال ({pct.toLocaleString("en-US")}٪)
            <Live iso={u.updated} cls="text-neutral-500" />
          </div>
        </div>
      </div>
    </section>
  )
}

