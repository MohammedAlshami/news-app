import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { AdminAdvertiseInquiryEditor } from "@/components/admin-advertise-inquiry-editor"
import { Button } from "@/components/ui/button"
import { getAdminAdvertiseInquiryById } from "@/lib/db-advertise-inquiries.server"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const row = await getAdminAdvertiseInquiryById(id)
  if (!row) {
    return { title: ar.adminAdvertiseMetaTitle }
  }
  return {
    title: `${row.name} | ${ar.adminAdvertiseDetailTitle}`,
  }
}

export default async function AdminAdvertiseInquiryPage({ params }: PageProps) {
  const { id } = await params
  const row = await getAdminAdvertiseInquiryById(id)
  if (!row) {
    notFound()
  }

  const initial = {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    message: row.message,
    status: row.status,
    adminNotes: row.adminNotes,
    createdAtIso: row.createdAt.toISOString(),
    updatedAtIso: row.updatedAt.toISOString(),
  }

  return (
    <div className={cn("flex-1 p-4 md:p-6 lg:p-8")}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {ar.adminAdvertiseDetailKicker}
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            {ar.adminAdvertiseDetailTitle}
          </h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/advertise">{ar.adminAdvertiseBack}</Link>
        </Button>
      </div>
      <AdminAdvertiseInquiryEditor initial={initial} />
    </div>
  )
}
