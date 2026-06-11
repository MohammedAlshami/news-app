import type { Metadata } from "next"

import { AdminPagination } from "@/components/admin-pagination"
import { AdminSearchBar } from "@/components/admin-search-bar"
import { AdminUsersTable } from "@/components/admin-users-table"
import { ADMIN_PAGE_SIZE, getAdminUserListPage } from "@/lib/db-users.server"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: ar.adminUsersMetaTitle,
  description: ar.loginMetaDescription,
}

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ page?: string; q?: string }>
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp?.page ?? "1") || 1)
  const q = sp?.q ?? ""
  const { rows, total } = await getAdminUserListPage({ page, q, role: "admin" })

  return (
    <div className={cn("flex-1 p-4 md:p-6 lg:p-8")}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{ar.adminKicker}</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            {ar.adminUsersPageTitle}
          </h1>
        </div>
        <AdminSearchBar />
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
        prevHref={page > 1 ? `/admin/users?page=${page - 1}${q ? `&q=${q}` : ""}` : undefined}
        nextHref={
          page * ADMIN_PAGE_SIZE < total
            ? `/admin/users?page=${page + 1}${q ? `&q=${q}` : ""}`
            : undefined
        }
      />
    </div>
  )
}
