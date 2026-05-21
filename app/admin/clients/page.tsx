import type { Metadata } from "next"

import { AdminPagination } from "@/components/admin-pagination"
import { AdminUsersTable } from "@/components/admin-users-table"
import { ADMIN_PAGE_SIZE, getAdminUserListPage } from "@/lib/db-users.server"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: ar.adminClientsMetaTitle,
  description: ar.loginMetaDescription,
}

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminClientsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp?.page ?? "1") || 1)
  const { rows, total } = await getAdminUserListPage({ page, role: "user" })

  return (
    <div className={cn("flex-1 p-4 md:p-6 lg:p-8")}>
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground">{ar.adminKicker}</p>
        <h1 className="text-balance text-2xl font-semibold tracking-tight">
          {ar.adminClientsPageTitle}
        </h1>
      </div>
      <AdminUsersTable
        rows={rows}
        labels={{
          colEmail: ar.adminUsersColEmail,
          colName: ar.adminUsersColName,
          colRole: ar.adminUsersColRole,
          colDate: ar.adminUsersColDate,
        }}
      />
      <AdminPagination
        className="mt-4"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        prevHref={page > 1 ? `/admin/clients?page=${page - 1}` : undefined}
        nextHref={
          page * ADMIN_PAGE_SIZE < total
            ? `/admin/clients?page=${page + 1}`
            : undefined
        }
      />
    </div>
  )
}
