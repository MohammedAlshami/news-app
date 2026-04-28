import type { Metadata } from "next"

import { AdminAdvertiseTable } from "@/components/admin-advertise-table"
import { getAdminAdvertiseInquiryList } from "@/lib/db-advertise-inquiries.server"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: ar.adminAdvertiseMetaTitle,
  description: ar.loginMetaDescription,
}

export const dynamic = "force-dynamic"

export default async function AdminAdvertisePage() {
  const rows = await getAdminAdvertiseInquiryList()

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
    </div>
  )
}
