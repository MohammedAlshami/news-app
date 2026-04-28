import Image from "next/image"
import Link from "next/link"

import type { SiteAdPublic } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

function safeHref(href: string): string {
  const t = href.trim()
  if (t === "" || t === "#") {
    return "#"
  }
  if (t.startsWith("/") || t.startsWith("http://") || t.startsWith("https://")) {
    return t
  }
  return "#"
}

type Props = {
  ads: SiteAdPublic[]
  className?: string
}

/**
 * Renders active banner ads as linked images (home + article placements).
 */
export function SiteAdSpots({ ads, className }: Props) {
  if (ads.length === 0) {
    return null
  }

  return (
    <aside
      className={cn("w-full space-y-4", className)}
      aria-label={ar.siteAdsAriaLabel}
    >
      {ads.map((ad) => {
        const href = safeHref(ad.href)
        const isExternal =
          href.startsWith("http://") || href.startsWith("https://")
        const inner = (
          <span className="relative block w-full overflow-hidden rounded-xl border border-border bg-muted/40">
            <span className="relative block aspect-[21/9] w-full max-h-[220px] sm:aspect-[24/5] sm:max-h-[180px]">
              <Image
                src={ad.imageUrl}
                alt=""
                fill
                className="object-contain"
                sizes="(max-width: 48rem) 100vw, 42rem"
                unoptimized={ad.imageUrl.startsWith("/uploads/")}
              />
            </span>
          </span>
        )

        return (
          <div key={ad.id}>
            {href === "#" ? (
              inner
            ) : (
              <Link
                href={href}
                className="block outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                {...(isExternal
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {inner}
              </Link>
            )}
          </div>
        )
      })}
    </aside>
  )
}
