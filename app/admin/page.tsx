import type { Metadata } from "next"

import { DashboardCharts } from "@/components/admin/dashboard-charts"
import {
  getArticlesCreatedOverTime,
  getDashboardStats,
  getTopViewedArticles,
} from "@/lib/db-stats.server"
import { ar } from "@/lib/ui-ar"

export const metadata: Metadata = {
  title: ar.adminMetaTitle,
  description: ar.loginMetaDescription,
}

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const [stats, viewsOverTime, topArticles] = await Promise.all([
    getDashboardStats(),
    getArticlesCreatedOverTime(30),
    getTopViewedArticles(5),
  ])

  return (
    <DashboardCharts
      stats={stats}
      viewsOverTime={viewsOverTime}
      topArticles={topArticles}
    />
  )
}
