import type { Metadata } from "next"

import { AdminPagination } from "@/components/admin-pagination"
import { AdminTopicsTable } from "@/components/admin-topics-table"
import { getAdminTopicsPage } from "@/lib/db-generated-articles.server"
import { ADMIN_GENERATED_PAGE_SIZE } from "@/lib/db-generated-articles.server"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "المواضيع - لوحة التحكم",
}

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminTopicsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp?.page ?? "1") || 1)
  const { rows: topicRows, total } = await getAdminTopicsPage({ page })

  return (
    <div className={cn("flex-1 p-4 md:p-6 lg:p-8")}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{ar.adminKicker}</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">المواضيع</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            المواضيع المستخرجة من الأخبار المجمّعة بالذكاء الاصطناعي
          </p>
        </div>
      </div>

      <AdminTopicsTable topics={topicRows} />

      <AdminPagination
        className="mt-4"
        page={page}
        pageSize={ADMIN_GENERATED_PAGE_SIZE}
        total={total}
        prevHref={page > 1 ? `/admin/topics?page=${page - 1}` : undefined}
        nextHref={
          page * ADMIN_GENERATED_PAGE_SIZE < total
            ? `/admin/topics?page=${page + 1}`
            : undefined
        }
      />
    </div>
  )
}
