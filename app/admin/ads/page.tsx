import type { Metadata } from "next"

import { createSiteAdAction } from "@/app/admin/ads/actions"
import { AdminAdsTable } from "@/components/admin-ads-table"
import { AdminPagination } from "@/components/admin-pagination"
import { Button } from "@/components/ui/button"
import { ADMIN_PAGE_SIZE, getAdminSiteAdListPage } from "@/lib/db-site-ads.server"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: ar.adminSiteAdsMetaTitle,
  description: ar.loginMetaDescription,
}

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ saved?: string; page?: string }>
}

export default async function AdminSiteAdsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const showSaved = sp?.saved === "1"
  const page = Math.max(1, Number(sp?.page ?? "1") || 1)
  const { rows, total } = await getAdminSiteAdListPage({ page })

  return (
    <div className={cn("flex-1 p-4 md:p-6 lg:p-8")}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{ar.adminKicker}</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            {ar.adminSiteAdsPageTitle}
          </h1>
        </div>
        <form action={createSiteAdAction}>
          <Button type="submit">{ar.adminSiteAdsAdd}</Button>
        </form>
      </div>

      {showSaved ? (
        <p
          className="mb-4 text-sm text-green-600 dark:text-green-400"
          role="status"
        >
          {ar.adminSiteAdSaved}
        </p>
      ) : null}

      <AdminAdsTable
        rows={rows}
        labels={{
          colName: ar.adminSiteAdsColName,
          colImage: ar.adminSiteAdsColImage,
          colPlacements: ar.adminSiteAdsColPlacements,
          colActive: ar.adminSiteAdsColActive,
          colTier: ar.adminSiteAdsColTier,
          colActions: ar.adminSiteAdsColActions,
          edit: ar.adminSiteAdsEdit,
          view: ar.adminSiteAdsView,
          placementHome: ar.adminSiteAdsPlacementHome,
          placementArticle: ar.adminSiteAdsPlacementArticle,
          yes: ar.yes,
          no: ar.no,
          tierStandard: ar.adminSiteAdTierStandard,
          tierGold: ar.adminSiteAdTierGold,
          tierPremium: ar.adminSiteAdTierPremium,
          tierPlatinum: ar.adminSiteAdTierPlatinum,
        }}
      />
      <AdminPagination
        className="mt-4"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        prevHref={page > 1 ? `/admin/ads?page=${page - 1}` : undefined}
        nextHref={page * ADMIN_PAGE_SIZE < total ? `/admin/ads?page=${page + 1}` : undefined}
      />
    </div>
  )
}
