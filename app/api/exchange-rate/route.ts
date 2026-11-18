import { NextResponse } from "next/server"

import { getLatestPriceRateByCurrency } from "@/lib/db-price-rates.server"

const CACHE = { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }

const err = (message: string, status: number) => NextResponse.json({ error: message }, { status })

function isValidCurrency(code: string) {
  return /^[A-Z]{3,10}$/.test(code)
}

/**
 * Any pair is supported through the Yemeni riyal:
 * - X → YER uses the sell rate, YER → X the buy rate (as before);
 * - X → Y (neither is YER) uses the mid rate of both sides, so the shop spread is not applied twice.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const from = (url.searchParams.get("from") ?? "USD").trim().toUpperCase()
  const to = (url.searchParams.get("to") ?? "YER").trim().toUpperCase()
  const market = (url.searchParams.get("market") ?? "sanaa").trim().toLowerCase().slice(0, 32)
  const amount = Number(url.searchParams.get("amount") ?? "1")

  if (!isValidCurrency(from) || !isValidCurrency(to) || !Number.isFinite(amount) || amount < 0) {
    return err("بيانات التحويل غير صحيحة.", 400)
  }
  const missing = () => err("السعر غير متوفر لهذه العملة حالياً.", 404)

  if (from === to) {
    return NextResponse.json({ base: from, quote: to, amount, rate: 1, result: amount, date: null, source: "" }, CACHE)
  }

  if (from === "YER") {
    const quote = await getLatestPriceRateByCurrency(market, to)
    if (!quote) return missing()
    return NextResponse.json(
      { base: from, quote: to, amount, rate: 1 / quote.buyRate, result: amount / quote.buyRate, date: quote.scrapedAt.toISOString(), source: quote.sourceUrl },
      CACHE,
    )
  }

  if (to === "YER") {
    const quote = await getLatestPriceRateByCurrency(market, from)
    if (!quote) return missing()
    return NextResponse.json(
      { base: from, quote: to, amount, rate: quote.sellRate, result: amount * quote.sellRate, date: quote.scrapedAt.toISOString(), source: quote.sourceUrl },
      CACHE,
    )
  }

  const [a, b] = await Promise.all([getLatestPriceRateByCurrency(market, from), getLatestPriceRateByCurrency(market, to)])
  if (!a || !b) return missing()
  const midA = (a.sellRate + a.buyRate) / 2
  const midB = (b.sellRate + b.buyRate) / 2
  if (!(midB > 0)) return missing()
  const rate = midA / midB
  const newest = a.scrapedAt > b.scrapedAt ? a : b
  return NextResponse.json(
    { base: from, quote: to, amount, rate, result: amount * rate, date: newest.scrapedAt.toISOString(), source: newest.sourceUrl },
    CACHE,
  )
}
