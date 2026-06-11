"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import type { DashboardStats, TopArticle, ViewsOverTime } from "@/lib/db-stats.server"
import { ar } from "@/lib/ui-ar"

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

function SummaryCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      title: "إجمالي المقالات",
      value: stats.totalArticles,
      description: "المقالات التحريرية",
    },
    {
      title: "المقالات المنشورة",
      value: stats.publishedArticles,
      description: `${stats.draftArticles} مسودة`,
    },
    {
      title: "المقالات المولّدة",
      value: stats.totalGeneratedArticles,
      description: "بالذكاء الاصطناعي",
    },
    {
      title: "إجمالي المشاهدات",
      value: stats.totalViews.toLocaleString(),
      description: "جميع المقالات",
    },
    {
      title: "الأقسام",
      value: stats.totalCategories,
      description: "تصنيفات الموقع",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">
              {card.title}
            </CardDescription>
            <CardTitle className="text-3xl">{card.value}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const areaConfig = {
  articles: {
    label: "مقالات",
    color: "var(--chart-1)",
  },
  generated: {
    label: "مولّد",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

function ViewsOverTimeChart({ data }: { data: ViewsOverTime }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>المقالات المنشورة</CardTitle>
        <CardDescription>آخر 30 يوماً</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={areaConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillArticles" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-articles)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-articles)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillGenerated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-generated)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-generated)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const d = new Date(value)
                return d.toLocaleDateString("ar", { month: "short", day: "numeric" })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="articles"
              type="natural"
              fill="url(#fillArticles)"
              stroke="var(--color-articles)"
              stackId="a"
            />
            <Area
              dataKey="generated"
              type="natural"
              fill="url(#fillGenerated)"
              stroke="var(--color-generated)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const barConfig = {
  views: {
    label: "المشاهدات",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

function TopArticlesChart({ data }: { data: TopArticle[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>الأكثر مشاهدة</CardTitle>
        <CardDescription>أعلى {data.length} مقال</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={barConfig} className="aspect-auto h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ left: -20, right: 0 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="title"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={180}
              tickFormatter={(value) =>
                value.length > 25 ? value.slice(0, 25) + "…" : value
              }
            />
            <XAxis dataKey="views" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="views" radius={4}>
              <LabelList
                dataKey="views"
                position="insideStart"
                className="fill-white font-bold"
              />
              {data.map((entry, index) => (
                <Cell
                  key={entry.id}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const pieConfig = {
  published: {
    label: "منشور",
    color: "var(--chart-2)",
  },
  draft: {
    label: "مسودة",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

function PublishedPieChart({ stats }: { stats: DashboardStats }) {
  const pieData = [
    { name: "منشور", value: stats.publishedArticles, fill: "var(--color-published)" },
    { name: "مسودة", value: stats.draftArticles, fill: "var(--color-draft)" },
  ]

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>حالة النشر</CardTitle>
        <CardDescription>المقالات التحريرية</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={pieConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function DashboardCharts({
  stats,
  viewsOverTime,
  topArticles,
}: {
  stats: DashboardStats
  viewsOverTime: ViewsOverTime
  topArticles: TopArticle[]
}) {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{ar.adminKicker}</p>
        <h1 className="text-balance mt-2 text-2xl font-semibold tracking-tight">
          {ar.adminPageTitle}
        </h1>
      </div>

      <SummaryCards stats={stats} />

      <div className="grid gap-6 md:grid-cols-2">
        <ViewsOverTimeChart data={viewsOverTime} />
        <TopArticlesChart data={topArticles} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <PublishedPieChart stats={stats} />
        <Card>
          <CardHeader>
            <CardTitle>معدل المشاهدات</CardTitle>
            <CardDescription>لكل مقال</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalArticles > 0
                ? Math.round(stats.totalViews / stats.totalArticles)
                : 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              متوسط المشاهدات لكل مقال
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>إجمالي {stats.totalViews.toLocaleString()} مشاهدة</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>نسبة النشر</CardTitle>
            <CardDescription>المقالات المنشورة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalArticles > 0
                ? Math.round((stats.publishedArticles / stats.totalArticles) * 100)
                : 0}
              %
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.publishedArticles} من أصل {stats.totalArticles} مقال
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>{stats.draftArticles} مسودة متبقية</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
