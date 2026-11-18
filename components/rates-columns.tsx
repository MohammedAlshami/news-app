import { LABELS, SYMBOLS } from "@/lib/currency-converter-data"
import type { RateLine } from "@/lib/db-price-rates.server"

const MAIN = ["USD", "SAR", "EUR", "AED", "GBP", "KWD"]
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 })

const TONES = {
  amber: { dot: "bg-[#e3c98f]", badge: "bg-[#f4e4c1] text-[#5a4410]" },
  blue: { dot: "bg-[#9fcbd6]", badge: "bg-[#cfe6ec] text-[#0d4a6e]" },
  yellow: { dot: "bg-[#e6d58f]", badge: "bg-[#f6ecc6] text-[#6b5800]" },
} as const

function RatesColumn({ title, lines, tone }: { title: string; lines: RateLine[]; tone: keyof typeof TONES }) {
  if (lines.length === 0) return null
  const t = TONES[tone]
  return (
    <div>
      <h3 className="mb-5 flex items-center gap-3 text-2xl font-extrabold text-black">
        <span className={`h-4 w-4 rounded-full ${t.dot}`} aria-hidden />
        {title}
      </h3>
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

export type RatesColumnsData = { sanaa: RateLine[]; aden: RateLine[]; gold: RateLine[] }

/** Sana'a / Aden / gold price lists (main currencies), shared by the converter page and the home section. */
export function RatesColumns({ sanaa, aden, gold }: RatesColumnsData) {
  const main = (l: RateLine[]) => MAIN.flatMap((c) => l.filter((x) => x.code === c))
  return (
    <div className="grid gap-12 md:grid-cols-3 md:gap-10">
      <RatesColumn title="صنعاء" lines={main(sanaa)} tone="amber" />
      <RatesColumn title="عدن" lines={main(aden)} tone="blue" />
      <RatesColumn title="الذهب" lines={gold} tone="yellow" />
    </div>
  )
}
