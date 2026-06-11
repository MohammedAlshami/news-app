import type { Metadata } from "next"

import { AdminSearchBar } from "@/components/admin-search-bar"
import { NewsSourcesClient } from "@/components/news-sources-client"
import { getAllNewsSources } from "@/lib/db-news-sources.server"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "مصادر الأخبار | إدارة",
}

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function AdminNewsSourcesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const q = sp?.q ?? ""
  const dbSources = await getAllNewsSources({ q })
  const enabledMap = Object.fromEntries(dbSources.map((s) => [s.key, s.isEnabled]))

  return (
    <div className={cn("flex-1 p-4 md:p-6 lg:p-8")}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{ar.adminKicker}</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">مصادر الأخبار</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إدارة المصادر الإخبارية التي يستخرج منها النظام المحتوى. فعّل أو عطّل أي مصدر وسيُطبَّق التغيير على عملية الاستخراج التالية.
          </p>
        </div>
        <AdminSearchBar />
      </div>

      <NewsSourcesClient initialEnabledMap={enabledMap} />
    </div>
  )
}
