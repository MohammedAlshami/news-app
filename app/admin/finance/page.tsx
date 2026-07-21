import type { Metadata } from "next"
import { getFinanceSummary } from "@/lib/db-finance.server"
import { FinanceClient } from "./finance-client"

export const metadata: Metadata = { title: "المالية | لوحة التحكم" }
export const dynamic = "force-dynamic"

export default async function AdminFinancePage() {
  const summary = await getFinanceSummary(30)
  return <FinanceClient data={summary} />
}
