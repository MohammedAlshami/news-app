import type { Metadata } from "next"

import { createSiteAdAction } from "@/app/admin/ads/actions"
import { AdminAdsTable } from "@/components/admin-ads-table"
import { Button } from "@/components/ui/button"
import { getAdminSiteAdList } from "@/lib/db-site-ads.server"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: ar.adminSiteAdsMetaTitle,
  description: ar.loginMetaDescription,
}

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ saved?: string }>
}

export default async function AdminSiteAdsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const showSaved = sp?.saved === "1"
  const rows = await getAdminSiteAdList()

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
    </div>
  )
}
