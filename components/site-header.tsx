import { getCategoryNavItems } from "@/lib/categories"
import { ALL_CATEGORIES_ID, getCategoryPagePath } from "@/lib/site-routes"
import { ar } from "@/lib/ui-ar"

import { SiteHeaderShell } from "@/components/site-header-shell"

export async function SiteHeader() {
  const nav = await getCategoryNavItems()
  const items = [
    { href: "/", label: ar.home },
    ...nav.filter((i) => i.id !== ALL_CATEGORIES_ID).slice(0, 5),
  ]
  return (
    <SiteHeaderShell
      items={items}
      browseHref={getCategoryPagePath(ALL_CATEGORIES_ID)}
    />
  )
}
