import Link from "next/link"
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Clock, DollarSign, Landmark, MapPin, TrendingUp } from "lucide-react"

import { UsdCalculator } from "@/components/usd-calculator"
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

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="absolute left-4 top-4 z-10 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-neutral-900 shadow">{children}</span>
)

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

/** A: emerald card, huge faded dollar sign, two big prices. */
function VariantA({ u, href }: { u: Usd; href: string }) {
  return (
    <section dir="rtl" lang="ar" className="py-6 md:py-10">
      <div className={WRAP}>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 p-6 text-white md:p-12">
          <Tag>تصميم A</Tag>
          <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-6 select-none text-[24rem] font-black leading-none text-white/10">$</span>
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 md:h-20 md:w-20"><DollarSign className="h-9 w-9 md:h-11 md:w-11" /></span>
              <div>
                <h2 className="text-3xl font-extrabold md:text-5xl">سعر الدولار في اليمن</h2>
                <Live iso={u.updated} />
              </div>
            </div>
            <Cta href={href} className="bg-white text-emerald-800" />
          </div>
          <div className="relative mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {[{ c: "صنعاء", p: u.sanaa }, { c: "عدن", p: u.aden }].map((x) => (
              <div key={x.c} className="rounded-3xl bg-white/15 p-6 backdrop-blur-sm md:p-8">
                <div className="flex items-center gap-2 text-lg font-bold text-white/90"><MapPin className="h-5 w-5" aria-hidden />{x.c}</div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-6xl font-black tabular-nums md:text-8xl">{fmt(x.p.sell)}</span>
                  <span className="text-xl font-bold text-white/80">ر.ي</span>
                </div>
                <div className="mt-2 text-lg font-bold text-white/80">شراء {fmt(x.p.buy)} · بيع {fmt(x.p.sell)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** B: two city panels (sun vs sea) with the gap between them. */
function VariantB({ u, href }: { u: Usd; href: string }) {
  const gap = u.aden.sell - u.sanaa.sell
  const pct = u.sanaa.sell > 0 ? Math.round((gap / u.sanaa.sell) * 100) : 0
  return (
    <section dir="rtl" lang="ar" className="py-6 md:py-10">
      <div className={WRAP}>
        <div className="relative">
          <Tag>تصميم B</Tag>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 pt-10 md:pt-0">
            <h2 className="text-3xl font-extrabold text-black md:text-5xl">الدولار بين صنعاء وعدن</h2>
            <Cta href={href} className="bg-black text-white" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-300 to-orange-500 p-7 text-neutral-900 md:p-10">
              <MapPin className="absolute -left-4 -top-4 h-40 w-40 text-white/25" aria-hidden />
              <div className="relative text-2xl font-extrabold md:text-3xl">صنعاء</div>
              <div className="relative mt-4 text-7xl font-black tabular-nums md:text-9xl">{fmt(u.sanaa.sell)}</div>
              <div className="relative mt-2 text-xl font-bold">ريال لكل دولار · شراء {fmt(u.sanaa.buy)}</div>
            </div>
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-400 to-blue-700 p-7 text-white md:p-10">
              <Landmark className="absolute -left-4 -top-4 h-40 w-40 text-white/15" aria-hidden />
              <div className="relative text-2xl font-extrabold md:text-3xl">عدن</div>
              <div className="relative mt-4 text-7xl font-black tabular-nums md:text-9xl">{fmt(u.aden.sell)}</div>
              <div className="relative mt-2 text-xl font-bold text-white/90">ريال لكل دولار · شراء {fmt(u.aden.buy)}</div>
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

/** C: trading-screen look, pair name, buy/sell chips with arrows. */
function VariantC({ u, href }: { u: Usd; href: string }) {
  return (
    <section dir="rtl" lang="ar" className="py-6 md:py-10">
      <div className={WRAP}>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-700 to-fuchsia-700 p-6 text-white md:p-12">
          <Tag>تصميم C</Tag>
          <svg aria-hidden viewBox="0 0 400 120" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full opacity-25" preserveAspectRatio="none">
            <path d="M0 90 L40 70 L80 80 L120 40 L160 60 L200 25 L240 50 L280 20 L320 45 L360 10 L400 30 L400 120 L0 120 Z" fill="white" />
          </svg>
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-base font-extrabold tracking-wide"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-lime-300" />USD / YER</div>
              <h2 className="mt-5 text-4xl font-extrabold leading-tight md:text-6xl">سوق الصرف<br />الدولار اليوم</h2>
              <div className="mt-4"><Live iso={u.updated} /></div>
              <div className="mt-7"><Cta href={href} className="bg-white text-violet-800" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[{ c: "صنعاء", p: u.sanaa }, { c: "عدن", p: u.aden }].map((x) => (
                <div key={x.c} className="rounded-3xl bg-white/15 p-5 backdrop-blur-sm md:p-6">
                  <div className="text-lg font-extrabold">{x.c}</div>
                  <div className="mt-3 flex items-center gap-2 text-lime-300"><ArrowUpRight className="h-6 w-6" aria-hidden /><span className="text-4xl font-black tabular-nums text-white md:text-6xl">{fmt(x.p.sell)}</span></div>
                  <div className="text-sm font-bold text-white/70">بيع</div>
                  <div className="mt-3 flex items-center gap-2 text-rose-300"><ArrowDownLeft className="h-6 w-6" aria-hidden /><span className="text-3xl font-black tabular-nums text-white md:text-4xl">{fmt(x.p.buy)}</span></div>
                  <div className="text-sm font-bold text-white/70">شراء</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** D: warm yellow panel with an interactive dollar calculator. */
function VariantD({ u, href }: { u: Usd; href: string }) {
  return (
    <section dir="rtl" lang="ar" className="py-6 md:py-10">
      <div className={WRAP}>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-100 to-yellow-200 p-6 md:p-12">
          <Tag>تصميم D</Tag>
          <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-400 text-white md:h-20 md:w-20"><DollarSign className="h-9 w-9 md:h-11 md:w-11" /></span>
              <h2 className="mt-5 text-4xl font-extrabold leading-tight text-neutral-900 md:text-6xl">كم يساوي<br />دولارك؟</h2>
              <p className="mt-3 text-lg font-medium text-amber-900/80">اكتب المبلغ وشاهد قيمته في صنعاء وعدن في نفس اللحظة.</p>
              <div className="mt-4"><Live iso={u.updated} cls="text-amber-900/70" /></div>
              <div className="mt-6"><Cta href={href} className="bg-neutral-900 text-white" /></div>
            </div>
            <div className="lg:col-span-7"><UsdCalculator sanaaSell={u.sanaa.sell} adenSell={u.aden.sell} /></div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** E: a banknote illustration beside the two prices. */
function VariantE({ u, href }: { u: Usd; href: string }) {
  return (
    <section dir="rtl" lang="ar" className="py-6 md:py-10">
      <div className={WRAP}>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-100 via-pink-100 to-orange-100 p-6 md:p-12">
          <Tag>تصميم E</Tag>
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <div className="relative mx-auto aspect-[16/9] w-full max-w-md -rotate-3 overflow-hidden rounded-3xl bg-gradient-to-br from-lime-300 to-emerald-500 shadow-xl shadow-emerald-900/20">
                <div className="absolute inset-3 rounded-2xl bg-white/20" />
                <span className="absolute right-6 top-4 text-4xl font-black text-emerald-900/70">1</span>
                <span className="absolute bottom-3 left-6 text-4xl font-black text-emerald-900/70">1</span>
                <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-800/80 text-6xl font-black text-lime-200">$</span></span>
              </div>
            </div>
            <div className="lg:col-span-7">
              <h2 className="text-4xl font-extrabold text-neutral-900 md:text-6xl">الدولار اليوم</h2>
              <div className="mt-2"><Live iso={u.updated} cls="text-rose-900/60" /></div>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white p-6"><div className="flex items-center gap-2 text-lg font-bold text-orange-600"><MapPin className="h-5 w-5" aria-hidden />صنعاء</div><div className="mt-2 text-6xl font-black tabular-nums text-neutral-900 md:text-7xl">{fmt(u.sanaa.sell)}</div><div className="mt-1 text-base font-bold text-neutral-400">شراء {fmt(u.sanaa.buy)}</div></div>
                <div className="rounded-3xl bg-white p-6"><div className="flex items-center gap-2 text-lg font-bold text-teal-600"><MapPin className="h-5 w-5" aria-hidden />عدن</div><div className="mt-2 text-6xl font-black tabular-nums text-neutral-900 md:text-7xl">{fmt(u.aden.sell)}</div><div className="mt-1 text-base font-bold text-neutral-400">شراء {fmt(u.aden.buy)}</div></div>
              </div>
              <div className="mt-6"><Cta href={href} className="bg-rose-500 text-white" /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Five stacked design options so one can be picked; the chosen one replaces this wrapper. */
export function HomeRatesVariants({ rates, href }: { rates: HomeRates; href: string }) {
  const u = usdFrom(rates)
  if (!u) return null
  return (
    <>
      <VariantA u={u} href={href} />
      <VariantB u={u} href={href} />
      <VariantC u={u} href={href} />
      <VariantD u={u} href={href} />
      <VariantE u={u} href={href} />
    </>
  )
}
