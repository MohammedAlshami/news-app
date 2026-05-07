"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { ArrowRightLeft, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LABELS } from "@/lib/currency-converter-data"
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
  label,
  value,
  onChange,
  market,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  market: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useOutsideClose(open, () => setOpen(false))
  const displayCode = value === "YER" ? `YER_${market.toUpperCase()}` : value
  const displayValue = LABELS[displayCode] ?? LABELS[value] ?? value

  return (
    <div ref={rootRef} className="relative rounded-[1.75rem] border border-gray-200 bg-white px-5 py-4">
      <span className="mb-2 block text-xs font-bold text-gray-400">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        className="flex w-full items-center justify-between gap-4 text-right"
      >
        <span className="text-2xl font-black tracking-tight text-gray-950 md:text-[2rem]">{displayValue}</span>
        <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
      </button>

      {open ? (
        <div className="absolute inset-x-4 top-[calc(100%+0.5rem)] z-20 max-h-72 overflow-auto rounded-2xl border border-gray-200 bg-white p-2">
          {COMMON.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                if (code === "YER_SANAA") onChange("YER_SANAA")
                else if (code === "YER_ADEN") onChange("YER_ADEN")
                else onChange(code)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-right hover:bg-gray-50"
            >
              <span className="font-bold text-gray-900">{LABELS[code] ?? code}</span>
              <span className="text-xs text-gray-500">
                {code === "YER_SANAA" ? "sanaa" : code === "YER_ADEN" ? "aden" : code}
              </span>
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

  return (
    <div className="mx-auto max-w-6xl">
      <section className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white">
        <div className="px-5 py-6 md:px-8 md:py-8">
          <h1 className="max-w-3xl text-3xl font-black leading-[1.05] tracking-tight text-gray-950 md:text-5xl">
            {ar.currencyConverterTitle}
          </h1>

          <p className="max-w-2xl text-base leading-8 text-gray-600 md:text-lg">
            {ar.currencyConverterSub}
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <SelectField label={ar.currencyConverterFrom} value={from} onChange={setFrom} market={market} />

            <div className="flex items-center justify-center lg:pt-7">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={swap}
                className="h-12 w-12 rounded-full border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                aria-label={ar.currencyConverterSwap}
              >
                <ArrowRightLeft className="h-5 w-5" />
              </Button>
            </div>

            <SelectField label={ar.currencyConverterTo} value={to} onChange={setTo} market={market} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="rounded-[1.75rem] border border-gray-200 bg-white px-5 py-4">
              <span className="mb-2 block text-xs font-bold text-gray-400">
                {ar.currencyConverterAmount}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                className="w-full bg-transparent text-2xl font-black tracking-tight text-gray-950 outline-none md:text-[2rem]"
              />
            </label>

            <label className="rounded-[1.75rem] border border-gray-200 bg-white px-5 py-4">
              <span className="mb-2 block text-xs font-bold text-gray-400">
                {ar.currencyConverterResult}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={resultAmount}
                onChange={(e) => onResultChange(e.target.value)}
                className="w-full bg-transparent text-2xl font-black tracking-tight text-gray-950 outline-none md:text-[2rem]"
              />
              <div className="mt-1 text-sm font-medium text-gray-500">{LABELS[to] ?? to}</div>
            </label>
          </div>

          {result ? (
            <div className="mt-4 rounded-[1.5rem] border border-gray-100 px-4 py-3 text-sm text-gray-500">
              <span>سعر الصرف: {result.rate.toLocaleString("en-US")}</span>
              <span className="mx-2">•</span>
              <span>{to === "YER_ADEN" ? "عدن" : to === "YER_SANAA" ? "صنعاء" : "الريال اليمني"}</span>
            </div>
          ) : null}

          {error ? (
            <p className="mt-5 rounded-[1.5rem] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          <p className="mt-5 max-w-3xl text-sm leading-7 text-gray-500">{ar.currencyConverterHint}</p>
        </div>
      </section>
    </div>
  )
}
