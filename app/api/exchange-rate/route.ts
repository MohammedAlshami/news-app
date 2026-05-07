import { NextResponse } from "next/server"

import { getLatestPriceRateByCurrency } from "@/lib/db-price-rates.server"

function isValidCurrency(code: string) {
  return /^[A-Z]{3,10}$/.test(code)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const from = (url.searchParams.get("from") ?? "USD").trim().toUpperCase()
  const to = (url.searchParams.get("to") ?? "YER").trim().toUpperCase()
  const market = (url.searchParams.get("market") ?? "sanaa").trim().toLowerCase()
  const amountRaw = url.searchParams.get("amount") ?? "1"
  const amount = Number(amountRaw)

  if (!isValidCurrency(from) || !isValidCurrency(to) || !Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "Invalid currency parameters" }, { status: 400 })
  }

  if (from === "YER") {
    const quote = await getLatestPriceRateByCurrency(market, to)
    if (!quote) {
      return NextResponse.json({ error: "Rate not available" }, { status: 404 })
    }
    const result = amount / quote.buyRate
    return NextResponse.json({
      base: from,
      quote: to,
      amount,
      rate: 1 / quote.buyRate,
      result,
      date: quote.scrapedAt.toISOString(),
      source: quote.sourceUrl,
    })
  }

  if (to === "YER") {
    const quote = await getLatestPriceRateByCurrency(market, from)
    if (!quote) {
      return NextResponse.json({ error: "Rate not available" }, { status: 404 })
    }
    const result = amount * quote.sellRate
    return NextResponse.json({
      base: from,
      quote: to,
      amount,
      rate: quote.sellRate,
      result,
      date: quote.scrapedAt.toISOString(),
      source: quote.sourceUrl,
    })
  }

  return NextResponse.json(
    { error: "Only conversions to or from YER are supported." },
    { status: 400 },
  )
}
