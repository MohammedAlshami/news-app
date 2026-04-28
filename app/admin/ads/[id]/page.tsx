import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SiteAdEditForm } from "@/components/site-ad-edit-form"
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
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground">
          {ar.adminSiteAdEditKicker}
        </p>
        <h1 className="text-balance text-2xl font-semibold tracking-tight">
          {ar.adminSiteAdEditTitle}
        </h1>
      </div>
      <SiteAdEditForm initial={row} />
    </div>
  )
}
