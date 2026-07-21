"use client"

import { useState } from "react"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis,
} from "recharts"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import type { FinanceSummary } from "@/lib/db-finance.server"

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"]

const SOURCE_LABELS: Record<string, string> = {
  google_ads: "إعلانات Google",
  memberships: "اشتراكات",
  paid_articles: "مقالات مدفوعة",
  direct_ads: "إعلانات مباشرة",
}

function SummaryCards({ data }: { data: FinanceSummary }) {
  const cards = [
    { title: "إجمالي الإيرادات", value: `$${data.totalRevenue.toFixed(2)}`, desc: "آخر 30 يوماً" },
    { title: "إعلانات Google", value: `$${data.googleAds.toFixed(2)}`, desc: `${((data.googleAds / data.totalRevenue) * 100).toFixed(1)}%` },
    { title: "اشتراكات", value: `$${data.memberships.toFixed(2)}`, desc: `${((data.memberships / data.totalRevenue) * 100).toFixed(1)}%` },
    { title: "مقالات مدفوعة", value: `$${data.paidArticles.toFixed(2)}`, desc: `${((data.paidArticles / data.totalRevenue) * 100).toFixed(1)}%` },
    { title: "إعلانات مباشرة", value: `$${data.directAds.toFixed(2)}`, desc: `${((data.directAds / data.totalRevenue) * 100).toFixed(1)}%` },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map(c => (
        <Card key={c.title}>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">{c.title}</CardDescription>
            <CardTitle className="text-3xl">{c.value}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">{c.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function RevenueChart({ data }: { data: FinanceSummary["dailyRevenue"] }) {
  const config = {
    google_ads: { label: "إعلانات Google", color: "var(--chart-1)" },
    memberships: { label: "اشتراكات", color: "var(--chart-2)" },
    paid_articles: { label: "مقالات مدفوعة", color: "var(--chart-3)" },
    direct_ads: { label: "إعلانات مباشرة", color: "var(--chart-4)" },
  } satisfies ChartConfig

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>الإيرادات اليومية</CardTitle>
        <CardDescription>آخر 30 يوماً</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={config} className="aspect-auto h-[300px] w-full">
          <AreaChart data={data}>
            <defs>
              {(Object.keys(config) as Array<keyof typeof config>).map((k) => (
                <linearGradient key={String(k)} id={`fill${String(k)}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config[k].color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={config[k].color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32}
              tickFormatter={v => { const d = new Date(v); return d.toLocaleDateString("ar", { month: "short", day: "numeric" }) }} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            {(Object.keys(config) as Array<keyof typeof config>).map(k => (
              <Area key={String(k)} dataKey={String(k)} type="natural" fill={`url(#fill${String(k)})`} stroke={config[k].color} stackId="1" />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const pieConfig = {
  google_ads: { label: "إعلانات Google", color: "var(--chart-1)" },
  memberships: { label: "اشتراكات", color: "var(--chart-2)" },
  paid_articles: { label: "مقالات مدفوعة", color: "var(--chart-3)" },
  direct_ads: { label: "إعلانات مباشرة", color: "var(--chart-4)" },
} satisfies ChartConfig

function SourcePieChart({ data }: { data: FinanceSummary["revenueBySource"] }) {
  const pieData = data.map(d => ({
    name: SOURCE_LABELS[d.source] || d.source,
    value: Math.round(d.amount * 100) / 100,
    fill: COLORS[data.indexOf(d) % COLORS.length],
  }))

  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle>توزيع الإيرادات</CardTitle>
        <CardDescription>حسب المصدر</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function TransactionsTab({ data }: { data: FinanceSummary }) {
  const latestTransactions = data.dailyRevenue.slice(-10).reverse()

  return (
    <div className="space-y-6">
      <SummaryCards data={data} />
      <div className="grid gap-6 md:grid-cols-3">
        <RevenueChart data={data.dailyRevenue} />
        <SourcePieChart data={data.revenueBySource} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>آخر المعاملات</CardTitle>
          <CardDescription>أحدث 10 أيام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-right font-medium">التاريخ</th>
                  <th className="p-2 text-right font-medium">إعلانات Google</th>
                  <th className="p-2 text-right font-medium">اشتراكات</th>
                  <th className="p-2 text-right font-medium">مقالات مدفوعة</th>
                  <th className="p-2 text-right font-medium">إعلانات مباشرة</th>
                  <th className="p-2 text-right font-medium">المجموع</th>
                </tr>
              </thead>
              <tbody>
                {latestTransactions.map(t => {
                  const total = t.google_ads + t.memberships + t.paid_articles + t.direct_ads
                  return (
                    <tr key={t.date} className="border-b last:border-0">
                      <td className="p-2">{t.date}</td>
                      <td className="p-2">${t.google_ads.toFixed(2)}</td>
                      <td className="p-2">${t.memberships.toFixed(2)}</td>
                      <td className="p-2">${t.paid_articles.toFixed(2)}</td>
                      <td className="p-2">${t.direct_ads.toFixed(2)}</td>
                      <td className="p-2 font-medium">${total.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const funnelConfig = {
  impressions: { label: "مرات الظهور", color: "var(--chart-1)" },
  clicks: { label: "نقرات", color: "var(--chart-2)" },
  conversions: { label: "تحويلات", color: "var(--chart-3)" },
  revenue: { label: "إيرادات", color: "var(--chart-4)" },
} satisfies ChartConfig

function MembershipsTab({ data }: { data: FinanceSummary }) {
  const funnelData = [
    { name: "مرات الظهور", value: 45000, fill: "var(--chart-1)" },
    { name: "نقرات", value: 3200, fill: "var(--chart-2)" },
    { name: "تحويلات", value: 185, fill: "var(--chart-3)" },
    { name: "إيرادات", value: Math.round(data.memberships), fill: "var(--chart-4)" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">إيرادات الاشتراكات</CardDescription>
            <CardTitle className="text-3xl">${data.memberships.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">آخر 30 يوماً</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">المشتركين النشطين</CardDescription>
            <CardTitle className="text-3xl">٢٤٣</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">اشتراك شهري $٢</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">المقالات المدفوعة</CardDescription>
            <CardTitle className="text-3xl">${data.paidArticles.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">آخر 30 يوماً</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">معدل التحويل</CardDescription>
            <CardTitle className="text-3xl">٥.٨٪</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">نقرات → تحويلات</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>قمع التحويل</CardTitle>
            <CardDescription>مسار الاشتراك من الظهور إلى الدفع</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={funnelConfig} className="aspect-auto h-[300px] w-full">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 40 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={90} />
                <XAxis dataKey="value" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="value" radius={4}>
                  {funnelData.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                  <LabelList dataKey="value" position="right" className="fill-foreground font-medium" />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع المقالات المدفوعة</CardTitle>
            <CardDescription>حسب الإيرادات</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[250px]">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie data={[
                  { name: "اشتراكات", value: Math.round(data.memberships), fill: "var(--chart-2)" },
                  { name: "مقالات مدفوعة", value: Math.round(data.paidArticles), fill: "var(--chart-3)" },
                ]} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                  <LabelList dataKey="value" position="outside" className="fill-foreground font-medium" />
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function FinanceClient({ data }: { data: FinanceSummary }) {
  const [tab, setTab] = useState("transactions")

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">المالية</p>
        <h1 className="text-balance mt-2 text-2xl font-semibold tracking-tight">الإيرادات والتحليلات المالية</h1>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("transactions")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
            tab === "transactions"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          المعاملات
        </button>
        <button
          onClick={() => setTab("memberships")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
            tab === "memberships"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          الاشتراكات والمقالات المدفوعة
        </button>
      </div>

      {tab === "transactions" && <div className="mt-6"><TransactionsTab data={data} /></div>}
      {tab === "memberships" && <div className="mt-6"><MembershipsTab data={data} /></div>}
    </div>
  )
}
