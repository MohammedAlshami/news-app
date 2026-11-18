"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { ArrowRightLeft, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LABELS, SYMBOLS } from "@/lib/currency-converter-data"
import { ar } from "@/lib/ui-ar"

const COMMON = [
  "USD",
  "EUR",
  "SAR",
  "AED",
  "GBP",
  "KWD",
  "QAR",
  "OMR",
  "BHD",
  "JOD",
  "EGP",
  "TRY",
  "INR",
  "YER_SANAA",
  "YER_ADEN",
]

type Result = {
  base: string
  quote: string
  amount: number
  rate: number
  result: number
  date: string | null
  source: string
}

async function fetchRate(from: string, to: string, amount: number, market: string): Promise<Result> {
  const res = await fetch(
    `/api/exchange-rate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}&market=${encodeURIComponent(market)}`,
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? ar.currencyConverterError)
  return data as Result
}

function useOutsideClose(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [open, onClose])

  return ref
}

function SelectField({
  value,
  onChange,
  market,
  badge,
}: {
  value: string
  onChange: (value: string) => void
  market: string
  badge: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useOutsideClose(open, () => setOpen(false))
  const displayCode = value === "YER" ? `YER_${market.toUpperCase()}` : value
  const displayValue = LABELS[displayCode] ?? LABELS[value] ?? value

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        className="flex w-full items-center justify-between gap-3 rounded-full bg-white/25 py-2 pl-4 pr-2 text-right transition-colors hover:bg-white/35"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-black ${badge}`}>{SYMBOLS[value] ?? value.slice(0, 1)}</span>
          <span className="truncate text-lg font-extrabold md:text-xl">{displayValue}</span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0" aria-hidden />
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 max-h-72 overflow-auto rounded-3xl bg-white p-2 text-neutral-900 shadow-xl shadow-black/15">
          {COMMON.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                onChange(code)
                setOpen(false)
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-right transition-colors hover:bg-neutral-100"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-black text-white">{SYMBOLS[code] ?? code.slice(0, 1)}</span>
              <span className="font-bold">{LABELS[code] ?? code}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function CurrencyConverter() {
  const [from, setFrom] = useState("USD")
  const [to, setTo] = useState("YER_SANAA")
  const [market, setMarket] = useState("sanaa")
  const [amount, setAmount] = useState("1")
  const [resultAmount, setResultAmount] = useState("0")
  const [editing, setEditing] = useState<"amount" | "result">("amount")
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState("")
  const [, startTransition] = useTransition()

  const normalizedAmount = useMemo(() => {
    const n = Number(amount)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }, [amount])

  useEffect(() => {
    const activeMarket = to === "YER_ADEN" || from === "YER_ADEN" ? "aden" : market
    setError("")
    startTransition(async () => {
      try {
        const next = await fetchRate(
          from === "YER_SANAA" || from === "YER_ADEN" ? "YER" : from,
          to === "YER_SANAA" || to === "YER_ADEN" ? "YER" : to,
          normalizedAmount,
          activeMarket,
        )
        setResult(next)
        if (editing === "amount") {
          setResultAmount(Number.isFinite(next.result) ? next.result.toString() : "0")
        } else if (next.rate > 0) {
          setAmount((Number(resultAmount) / next.rate).toString())
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : ar.currencyConverterError)
      }
    })
  }, [from, to, normalizedAmount, market, editing, resultAmount])

  const swap = () => {
    setFrom(to)
    setTo(from)
  }

  const onAmountChange = (nextAmount: string) => {
    setEditing("amount")
    setAmount(nextAmount)
  }

  const onResultChange = (nextResult: string) => {
    setEditing("result")
    setResultAmount(nextResult)
    const next = Number(nextResult)
    if (!Number.isFinite(next) || !result || result.rate <= 0) return
    setAmount((next / result.rate).toString())
  }

  const rateLine = result ? `1 ${SYMBOLS[from] ?? from} = ${result.rate.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${SYMBOLS[to] ?? to}` : null

  return (
    <div className="w-full">
      <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-black md:text-6xl">{ar.currencyConverterTitle}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-neutral-500">{ar.currencyConverterSub}</p>

      <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-[2rem] bg-amber-400 p-6 text-neutral-900 md:p-8">
          <span className="mb-4 block text-sm font-extrabold text-neutral-900/60">{ar.currencyConverterFrom}</span>
          <SelectField value={from} onChange={setFrom} market={market} badge="bg-neutral-900 text-amber-300" />
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            aria-label={ar.currencyConverterAmount}
            className="mt-6 w-full bg-transparent text-6xl font-black tabular-nums outline-none md:text-8xl"
          />
        </div>

        <div className="flex items-center justify-center">
          <Button
            type="button"
            size="icon"
            onClick={swap}
            className="h-14 w-14 rounded-full border-0 bg-black text-white hover:bg-neutral-800 lg:rotate-0"
            aria-label={ar.currencyConverterSwap}
          >
            <ArrowRightLeft className="h-6 w-6" />
          </Button>
        </div>

        <div className="rounded-[2rem] bg-blue-600 p-6 text-white md:p-8">
          <span className="mb-4 block text-sm font-extrabold text-white/70">{ar.currencyConverterTo}</span>
          <SelectField value={to} onChange={setTo} market={market} badge="bg-white text-blue-700" />
          <input
            type="number"
            min="0"
            step="0.01"
            value={resultAmount}
            onChange={(e) => onResultChange(e.target.value)}
            aria-label={ar.currencyConverterResult}
            className="mt-6 w-full bg-transparent text-6xl font-black tabular-nums outline-none md:text-8xl"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {rateLine ? <span className="rounded-full bg-black px-5 py-2.5 text-base font-extrabold tabular-nums text-white">{rateLine}</span> : null}
        {result ? (
          <span className="rounded-full bg-amber-100 px-5 py-2.5 text-base font-bold text-amber-900">
            {to === "YER_ADEN" || from === "YER_ADEN" ? "سعر عدن" : "سعر صنعاء"}
          </span>
        ) : null}
        {error ? <span className="rounded-full bg-red-100 px-5 py-2.5 text-base font-bold text-red-700">{error}</span> : null}
      </div>
    </div>
  )
}
