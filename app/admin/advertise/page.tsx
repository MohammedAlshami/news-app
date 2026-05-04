import type { Metadata } from "next"

import { AdminAdvertiseTable } from "@/components/admin-advertise-table"
import { AdminPagination } from "@/components/admin-pagination"
import { ADMIN_PAGE_SIZE, getAdminAdvertiseInquiryListPage } from "@/lib/db-advertise-inquiries.server"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: ar.adminAdvertiseMetaTitle,
  description: ar.loginMetaDescription,
}

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminAdvertisePage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp?.page ?? "1") || 1)
  const { rows, total } = await getAdminAdvertiseInquiryListPage({ page })

  return (
    <div className={cn("flex-1 p-4 md:p-6 lg:p-8")}>
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground">{ar.adminKicker}</p>
        <h1 className="text-balance text-2xl font-semibold tracking-tight">
          {ar.adminAdvertisePageTitle}
        </h1>
      </div>

      <AdminAdvertiseTable
        rows={rows}
        labels={{
          colName: ar.adminAdvertiseColName,
          colEmail: ar.adminAdvertiseColEmail,
          colDate: ar.adminAdvertiseColDate,
          colMessage: ar.adminAdvertiseColMessage,
          colStatus: ar.adminAdvertiseColStatus,
          colActions: ar.adminAdvertiseColActions,
          view: ar.adminAdvertiseView,
          openRecord: ar.adminAdvertiseOpenPage,
        }}
      />
      <AdminPagination
        className="mt-4"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        prevHref={page > 1 ? `/admin/advertise?page=${page - 1}` : undefined}
        nextHref={
          page * ADMIN_PAGE_SIZE < total
            ? `/admin/advertise?page=${page + 1}`
            : undefined
        }
      />
    </div>
  )
}
