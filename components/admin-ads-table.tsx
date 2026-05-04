"use client"

import { Eye, MoreVertical, Pencil, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { AdminSiteAdPreviewModal } from "@/components/admin-site-ad-preview-modal"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AdminSiteAdListItem } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"

type Props = {
  rows: AdminSiteAdListItem[]
  labels: {
    colName: string
    colImage: string
    colPlacements: string
    colActive: string
    colTier: string
    colActions: string
    edit: string
    view: string
    placementHome: string
    placementArticle: string
    yes: string
    no: string
    tierStandard: string
    tierGold: string
    tierPremium: string
    tierPlatinum: string
  }
}

function tierCellLabel(tier: string, labels: Props["labels"]): string {
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

export function AdminAdsTable({ rows, labels }: Props) {
  const [viewAd, setViewAd] = useState<AdminSiteAdListItem | null>(null)
  const [viewOpen, setViewOpen] = useState(false)

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {ar.adminSiteAdsNoRows}
      </p>
    )
  }

  return (
    <>
      <AdminSiteAdPreviewModal
        ad={viewAd}
        open={viewOpen}
        onOpenChange={(next) => {
          setViewOpen(next)
          if (!next) setViewAd(null)
        }}
        tierLabels={{
          tierStandard: labels.tierStandard,
          tierGold: labels.tierGold,
          tierPremium: labels.tierPremium,
          tierPlatinum: labels.tierPlatinum,
        }}
        placementHome={labels.placementHome}
        placementArticle={labels.placementArticle}
        yes={labels.yes}
        no={labels.no}
      />
      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg border bg-card">
        <Table dir="rtl">
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="h-12 min-w-[8rem] px-4 text-start font-medium">
                {labels.colName}
              </TableHead>
              <TableHead className="h-12 min-w-[5rem] px-4 text-start font-medium">
                {labels.colImage}
              </TableHead>
              <TableHead className="h-12 min-w-[10rem] px-4 text-start font-medium">
                {labels.colPlacements}
              </TableHead>
              <TableHead className="h-12 w-[5rem] px-4 text-start font-medium">
                {labels.colActive}
              </TableHead>
              <TableHead className="h-12 w-[6rem] px-4 text-start font-medium">
                {labels.colTier}
              </TableHead>
              <TableHead className="h-12 min-w-[5rem] px-2 text-center font-medium">
                {labels.colActions}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} className="hover:bg-muted/50">
                <TableCell className="h-16 max-w-[12rem] px-4 text-start font-medium">
                  <span className="block max-w-full truncate" title={r.name}>
                    {r.name.trim() || "—"}
                  </span>
                </TableCell>
                <TableCell className="h-16 px-4 text-start text-sm text-muted-foreground">
                  {r.imageUrl ? labels.yes : labels.no}
                </TableCell>
                <TableCell className="h-16 px-4 text-start text-sm text-muted-foreground">
                  <span className="flex flex-wrap gap-1">
                    {r.showOnHome ? (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                        {labels.placementHome}
                      </span>
                    ) : null}
                    {r.showOnArticle ? (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                        {labels.placementArticle}
                      </span>
                    ) : null}
                    {!r.showOnHome && !r.showOnArticle ? "—" : null}
                  </span>
                </TableCell>
                <TableCell className="h-16 px-4 text-start text-sm">
                  {r.isActive ? labels.yes : labels.no}
                </TableCell>
                <TableCell className="h-16 px-4 text-start text-sm font-medium">
                  {tierCellLabel(r.tier, labels)}
                </TableCell>
                <TableCell className="h-16 px-2 text-center">
                  <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreVertical className="size-4" />
                        <span className="sr-only">{labels.colActions}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-40">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/ads/${r.id}`}>
                          <Pencil className="size-4" />
                          {labels.edit}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          setViewAd(r)
                          setViewOpen(true)
                        }}
                      >
                        <Eye className="size-4" />
                        {labels.view}
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <ImageIcon className="size-4" />
                        {r.imageUrl ? labels.yes : labels.no}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
