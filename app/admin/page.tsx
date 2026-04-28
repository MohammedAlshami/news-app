import type { Metadata } from "next"

import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: ar.adminMetaTitle,
  description: ar.loginMetaDescription,
}

export default function AdminDashboardPage() {
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8">
      <p className="text-sm font-medium text-muted-foreground">{ar.adminKicker}</p>
      <h1
        className={cn(
          "text-balance mt-2 text-2xl font-semibold tracking-tight",
        )}
      >
        {ar.adminPageTitle}
      </h1>
      <p className="text-pretty mt-3 text-muted-foreground">{ar.adminWelcome}</p>
    </div>
  )
}
