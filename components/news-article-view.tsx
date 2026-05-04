import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatArticleDate } from "@/lib/format-date"
import { cn } from "@/lib/utils"

type Props = {
  /** Primary nav control (e.g. back to category) */
  back: { href: string; label: string }
  /** More buttons in the top bar, e.g. “الرئيسية” (home) */
  actions?: ReactNode
  /** Optional hero (banner) above the byline. */
  coverImageUrl?: string | null
  /** Category line text (before the date). */
  categoryByline: string
  /** `YYYY-MM-DD` for `<time dateTime>`. */
  date: string
  title: string
  excerpt: string
  children: ReactNode
  /**
   * When true, drops full-viewport height so the shell fits inside scroll regions
   * (e.g. admin preview modal).
   */
  embedded?: boolean
  /**
   * When false, hides the muted top bar with the back link (used in the admin preview modal).
   */
  showTopBar?: boolean
  /** Optional promotional banner(s) between excerpt and article body. */
  adSlot?: ReactNode
}

/**
 * Public article shell (shared by `/news/[id]`, `/admin/articles/preview/[id]`, and
 * the admin preview modal).
 */
export function NewsArticleView({
  back,
  actions,
  coverImageUrl,
  categoryByline,
  date,
  title,
  excerpt,
  children,
  embedded = false,
  showTopBar = true,
  adSlot,
}: Props) {
  return (
    <div
      className={cn(
        !embedded && "min-h-svh",
        "min-w-0 max-w-full",
      )}
    >
      {showTopBar ? (
        <div className="border-b bg-muted/40">
          <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
            <div className="flex flex-wrap items-center gap-2 sm:justify-center">
              <Button
                asChild
                variant="outline"
                size="sm"
              >
                <Link href={back.href} aria-label={back.label}>
                  <ArrowRight className="size-4 rotate-180" />
                  <span className="sr-only">{back.label}</span>
                </Link>
              </Button>
              {actions}
            </div>
          </div>
        </div>
      ) : null}

      {coverImageUrl ? (
        <div className="mx-auto w-full min-w-0 max-w-3xl px-4 pt-6 sm:px-6">
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-border bg-muted sm:aspect-[21/7]">
            <Image
              src={coverImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 48rem) 100vw, 48rem"
              unoptimized
            />
          </div>
        </div>
      ) : null}

      <article
        className={cn(
          "mx-auto w-full min-w-0 max-w-2xl px-4 sm:px-6",
          embedded ? "pb-8 pt-6" : "py-10",
        )}
      >
        <p className="text-xs font-medium tracking-wide text-muted-foreground">
          {categoryByline} ·{" "}
          <time dateTime={date} className="text-muted-foreground">
            {formatArticleDate(date)}
          </time>
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-pretty text-lg text-muted-foreground">
          {excerpt}
        </p>
        {adSlot ? <div className="mt-8 min-w-0 max-w-full">{adSlot}</div> : null}
        <div className="mt-10 min-w-0 max-w-full overflow-x-hidden text-pretty text-lg text-muted-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground">
          {children}
        </div>
      </article>
    </div>
  )
}
