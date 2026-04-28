"use client"

import { usePathname } from "next/navigation"

import { DashboardSidebar } from "@/components/sidebar-03/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

type Props = {
  children: React.ReactNode
}

export function AdminLayoutShell({ children }: Props) {
  const pathname = usePathname()
  const isFullscreenArticlePreview = pathname?.startsWith(
    "/admin/articles/preview/",
  ) ?? false
  if (isFullscreenArticlePreview) {
    return <div className="min-h-svh bg-background" dir="rtl">{children}</div>
  }

  return (
    <SidebarProvider>
      <div
        className="relative flex h-svh w-full min-h-0 flex-row overflow-hidden"
        dir="rtl"
      >
        <DashboardSidebar />
        <SidebarInset
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto",
          )}
        >
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3 py-2 md:hidden">
            <SidebarTrigger
              className="[&>svg]:-scale-x-100"
              aria-label={ar.adminToggleSidebar}
            />
            <span className="min-w-0 text-sm font-medium text-foreground">
              {ar.adminPageTitle}
            </span>
          </header>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}