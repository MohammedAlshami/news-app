import Link from "next/link"

import { ar } from "@/lib/ui-ar"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-start">
        <span>{ar.footerRights}</span>
        <Link
          href="/advertise"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {ar.footerAdvertise}
        </Link>
      </div>
    </footer>
  )
}
