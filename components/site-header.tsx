import Link from "next/link"

import { ALL_CATEGORIES_ID, getCategoryPagePath } from "@/lib/site-routes"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div
        className={cn(
          "mx-auto flex h-12 max-w-3xl items-center justify-between gap-4 px-4",
        )}
      >
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          {ar.newsBrand}
        </Link>
        <nav
          className="flex items-center gap-3 text-sm text-muted-foreground"
          aria-label="رئيسي"
        >
          <Link href="/" className="hover:text-foreground">
            {ar.home}
          </Link>
          <Link
            href={getCategoryPagePath(ALL_CATEGORIES_ID)}
            className="hover:text-foreground"
          >
            {ar.all}
          </Link>
          <Link href="/advertise" className="hover:text-foreground">
            {ar.footerAdvertise}
          </Link>
          <Link href="/login" className="hover:text-foreground">
            {ar.login}
          </Link>
        </nav>
      </div>
    </header>
  )
}
