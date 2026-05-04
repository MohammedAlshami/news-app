import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { SiteAdEditForm } from "@/components/site-ad-edit-form"
import { Button } from "@/components/ui/button"
import { getAdminSiteAdById } from "@/lib/db-site-ads.server"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const row = await getAdminSiteAdById(id)
  if (!row) {
    return { title: ar.adminSiteAdsMetaTitle }
  }
  const n = row.name.trim()
  return {
    title: n ? `${n} | ${ar.adminSiteAdEditTitle}` : ar.adminSiteAdsMetaTitle,
  }
}

export default async function AdminSiteAdEditPage({ params }: PageProps) {
  const { id } = await params
  const row = await getAdminSiteAdById(id)
  if (!row) {
    notFound()
  }

  return (
    <div className={cn("flex-1 p-4 md:p-6 lg:p-8")}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {ar.adminSiteAdEditKicker}
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            {ar.adminSiteAdEditTitle}
          </h1>
        </div>
        <Button variant="outline" size="icon" className="shrink-0" asChild>
          <Link href="/admin/ads" aria-label={ar.adminSiteAdBack}>
            <ArrowRight className="size-4 rotate-180" />
            <span className="sr-only">{ar.adminSiteAdBack}</span>
          </Link>
        </Button>
      </div>
      <SiteAdEditForm initial={row} />
    </div>
  )
}
