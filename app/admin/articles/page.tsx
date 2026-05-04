import type { Metadata } from "next"

import { createDraftArticleAction } from "@/app/admin/articles/actions"
import { AdminArticlesTable } from "@/components/admin-articles-table"
import { AdminPagination } from "@/components/admin-pagination"
import { Button } from "@/components/ui/button"
import { ADMIN_PAGE_SIZE, getAdminArticleListPage } from "@/lib/db-articles.server"
import { getCategories } from "@/lib/categories"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: ar.adminArticlesMetaTitle,
  description: ar.loginMetaDescription,
}

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ saved?: string; page?: string }>
}

export default async function AdminArticlesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const showSaved = sp?.saved === "1"
  const page = Math.max(1, Number(sp?.page ?? "1") || 1)
  const { rows: articles, total } = await getAdminArticleListPage({ page })
  const categories = await getCategories()

  return (
    <div
      className={cn("flex-1 p-4 md:p-6 lg:p-8")}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {ar.adminKicker}
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            {ar.adminArticlesPageTitle}
          </h1>
        </div>
        <form action={createDraftArticleAction}>
          <Button type="submit">{ar.adminArticlesAdd}</Button>
        </form>
      </div>

      {showSaved ? (
        <p
          className="mb-4 text-sm text-green-600 dark:text-green-400"
          role="status"
        >
          {ar.adminArticleUpdated}
        </p>
      ) : null}

      <AdminArticlesTable
        articles={articles}
        categories={categories}
        labels={{
          colTitle: ar.adminArticlesColTitle,
          colDate: ar.adminArticlesColDate,
          colCategories: ar.adminArticlesColCategories,
          colExcerpt: ar.adminArticlesColExcerpt,
          colPublished: ar.adminArticlesColPublished,
          colActions: ar.adminArticlesColActions,
          publishToggle: ar.adminArticlePublishToggle,
          openPublic: ar.adminArticlesOpenPublic,
          edit: ar.adminArticlesColEdit,
          notPublic: ar.adminArticleNotPublicYet,
          preview: ar.adminArticlePreview,
          viewLive: ar.adminArticleViewLive,
        }}
      />
      <AdminPagination
        className="mt-4"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        prevHref={page > 1 ? `/admin/articles?page=${page - 1}` : undefined}
        nextHref={
          page * ADMIN_PAGE_SIZE < total
            ? `/admin/articles?page=${page + 1}`
            : undefined
        }
      />
    </div>
  )
}
