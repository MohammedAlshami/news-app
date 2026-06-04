import type { ReactNode } from "react"
import Image from "next/image"
import { formatArticleDate } from "@/lib/format-date"
import { cn } from "@/lib/utils"

type Props = {
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
  /** Optional promotional banner(s) between excerpt and article body. */
  adSlot?: ReactNode
}

/**
 * Public article shell (shared by `/news/[id]`, `/admin/articles/preview/[id]`, and
 * the admin preview modal).
 */
export function NewsArticleView({
  coverImageUrl,
  categoryByline,
  date,
  title,
  excerpt,
  children,
  embedded = false,
  adSlot,
}: Props) {
  return (
    <div
      className={cn(
        !embedded && "min-h-svh",
        "min-w-0 max-w-full",
      )}
    >

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
              loading="eager"
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
        <div className="mt-10 min-w-0 max-w-full overflow-x-hidden text-pretty text-lg text-muted-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground">
          {children}
        </div>
        {adSlot ? <div className="mt-8 min-w-0 max-w-full">{adSlot}</div> : null}
      </article>
    </div>
  )
}
