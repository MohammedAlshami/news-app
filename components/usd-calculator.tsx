"use client"

import { useState } from "react"
import { Banknote } from "lucide-react"

const fmt = (n: number) => Math.round(n).toLocaleString("en-US")

/** Tiny dollar → riyal calculator for the home rates section (Sana'a and Aden at once). */
export function UsdCalculator({ sanaaSell, adenSell }: { sanaaSell: number; adenSell: number }) {
  const [raw, setRaw] = useState("100")
  const amount = Number(raw)
  const ok = Number.isFinite(amount) && amount >= 0
  return (
    <div className="space-y-5">
      <label className="flex items-center gap-4 rounded-3xl bg-white px-6 py-5 shadow-sm shadow-amber-900/10">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-3xl font-black text-white">$</span>
        <input
          inputMode="decimal"
          value={raw}
          onChange={(e) => setRaw(e.target.value.replace(/[^\d.]/g, ""))}
          aria-label="المبلغ بالدولار"
          className="w-full bg-transparent text-5xl font-black tabular-nums text-neutral-900 outline-none md:text-6xl"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {[50, 100, 500, 1000].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setRaw(String(v))}
            className="rounded-full bg-white/70 px-5 py-2 text-base font-extrabold text-amber-900 transition-colors hover:bg-white"
          >
            ${v}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { city: "صنعاء", v: sanaaSell, tint: "bg-orange-500" },
          { city: "عدن", v: adenSell, tint: "bg-teal-600" },
        ].map((c) => (
          <div key={c.city} className={`${c.tint} rounded-3xl p-6 text-white`}>
            <div className="flex items-center gap-2 text-base font-bold text-white/85">
              <Banknote className="h-5 w-5" aria-hidden />
              {c.city}
            </div>
            <div className="mt-3 text-5xl font-black tabular-nums md:text-6xl">{ok ? fmt(amount * c.v) : "—"}</div>
            <div className="mt-1 text-lg font-bold text-white/85">ريال يمني</div>
          </div>
        ))}
      </div>
    </div>
  )
}
