"use client"

import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import type { AdminSiteAdListItem } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"

type TierLabels = {
  tierStandard: string
  tierGold: string
  tierPremium: string
  tierPlatinum: string
}

type Props = {
  ad: AdminSiteAdListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  tierLabels: TierLabels
  placementHome: string
  placementArticle: string
  yes: string
  no: string
}

function tierLabel(tier: string, labels: TierLabels): string {
  switch (tier) {
    case "gold":
      return labels.tierGold
    case "premium":
      return labels.tierPremium
    case "platinum":
      return labels.tierPlatinum
    default:
      return labels.tierStandard
  }
}

export function AdminSiteAdPreviewModal({
  ad,
  open,
  onOpenChange,
  tierLabels,
  placementHome,
  placementArticle,
  yes,
  no,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="flex max-h-[92vh] max-w-[calc(100%-2rem)] min-w-0 flex-col gap-0 overflow-hidden p-0 pt-12 sm:max-w-lg"
        showCloseButton
      >
        <DialogTitle className="sr-only">{ar.adminSiteAdViewModalTitle}</DialogTitle>

        {ad ? (
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pb-6 pt-2">
            <div className="space-y-4 text-start">
              {ad.imageUrl ? (
                <div className="relative aspect-[21/9] w-full overflow-hidden rounded-md border bg-muted">
                  <Image
                    src={ad.imageUrl}
                    alt=""
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
                  {ar.adminSiteAdsColImage}: {no}
                </div>
              )}

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-foreground">
                    {ar.adminSiteAdFieldName}
                  </dt>
                  <dd className="mt-0.5 text-muted-foreground">
                    {ad.name.trim() || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">
                    {ar.adminSiteAdFieldHref}
                  </dt>
                  <dd className="mt-0.5 break-all text-muted-foreground">
                    {ad.href && ad.href !== "#" ? (
                      <a
                        href={ad.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="inline-block max-w-full text-primary underline-offset-4 hover:underline"
                      >
                        {ad.href}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">
                    {ar.adminSiteAdsColTier}
                  </dt>
                  <dd className="mt-0.5 font-medium text-muted-foreground">
                    {tierLabel(ad.tier, tierLabels)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">
                    {ar.adminSiteAdsColPlacements}
                  </dt>
                  <dd className="mt-0.5">
                    <span className="flex flex-wrap gap-1">
                      {ad.showOnHome ? (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {placementHome}
                        </span>
                      ) : null}
                      {ad.showOnArticle ? (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {placementArticle}
                        </span>
                      ) : null}
                      {!ad.showOnHome && !ad.showOnArticle ? "—" : null}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">
                    {ar.adminSiteAdFieldActive}
                  </dt>
                  <dd className="mt-0.5 text-muted-foreground">
                    {ad.isActive ? yes : no}
                  </dd>
                </div>
              </dl>

              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/ads/${ad.id}`}>{ar.adminSiteAdModalOpenEdit}</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
