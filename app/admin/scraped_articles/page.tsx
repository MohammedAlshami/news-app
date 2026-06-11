import type { Metadata } from "next"

import { AdminScrapedArticlesClient } from "@/components/admin-scraped-articles-client"
import { AdminScrapedArticlesTable } from "@/components/admin-scraped-articles-table"
import { AdminPagination } from "@/components/admin-pagination"
import { AdminSearchBar } from "@/components/admin-search-bar"
import { ADMIN_SCRAPED_PAGE_SIZE, getAdminScrapedNewsListPage } from "@/lib/db-scraped-news.server"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "المقالات المستخرجة - لوحة التحكم",
  description: "إدارة المقالات المستخرجة من المصادر الإخبارية",
}

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ page?: string; q?: string }>
}

export default async function AdminScrapedArticlesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp?.page ?? "1") || 1)
  const q = sp?.q ?? ""
  const { rows: articles, total } = await getAdminScrapedNewsListPage({ page, q })

  return (
    <div className={cn("flex-1 p-4 md:p-6 lg:p-8")}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {ar.adminKicker}
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            المقالات المستخرجة
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            عرض المقالات المستخرجة من المصادر الإخبارية (RT Arabic, Independent Arabia)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminSearchBar />
          <AdminScrapedArticlesClient />
        </div>
      </div>

      <AdminScrapedArticlesTable
        articles={articles}
        labels={{
          colTitle: ar.adminArticlesColTitle,
          colSource: "المصدر",
          colCategory: "الفئة",
          colScrapedAt: "تاريخ الاستخراج",
          colPublishedAt: "تاريخ النشر",
          colExcerpt: ar.adminArticlesColExcerpt,
          colActions: ar.adminArticlesColActions,
          viewOriginal: "عرض الأصل",
          preview: ar.adminArticlePreview,
        }}
      />
      <AdminPagination
        className="mt-4"
        page={page}
        pageSize={ADMIN_SCRAPED_PAGE_SIZE}
        total={total}
        prevHref={page > 1 ? `/admin/scraped_articles?page=${page - 1}${q ? `&q=${q}` : ""}` : undefined}
        nextHref={
          page * ADMIN_SCRAPED_PAGE_SIZE < total
            ? `/admin/scraped_articles?page=${page + 1}${q ? `&q=${q}` : ""}`
            : undefined
        }
      />
    </div>
  )
}
