import Link from "next/link"

import { getCategoryNavItems } from "@/lib/categories"
import { cn } from "@/lib/utils"

type CategoryNavProps = {
  /** Virtual `all` id, a category UUID, or `null` on the home page (no selection). */
  active: string | null
}

export async function CategoryNav({ active }: CategoryNavProps) {
  const nav = await getCategoryNavItems()
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2"
      aria-label="Sections"
    >
      {nav.map((item) => {
        const isActive = active !== null && item.id === active
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "border-foreground bg-foreground text-background"
                : "border-border/80 bg-card text-foreground hover:border-foreground/30",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
