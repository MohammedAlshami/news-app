import type { ReactNode } from "react"
import { formatArticleDate } from "@/lib/format-date"
import { cn } from "@/lib/utils"

type Props = {
  /** Category line text (before the date). */
  categoryByline?: string
  /** `YYYY-MM-DD` for `<time dateTime>`. */
  date?: string
  title?: string
  excerpt?: string
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
      <article
        className={cn(
          "w-full min-w-0",
          embedded ? "pb-8 pt-6" : title ? "py-10" : "pb-10 pt-0",
        )}
      >
        {categoryByline && date && (
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            {categoryByline} ·{" "}
            <time dateTime={date} className="text-muted-foreground">
              {formatArticleDate(date)}
            </time>
          </p>
        )}
        {title && (
          <h1 className="mt-2 text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {title}
          </h1>
        )}
        {excerpt && (
          <p className="mt-4 text-pretty text-lg text-foreground">
            {excerpt}
          </p>
        )}
        <div className="mt-10 min-w-0 max-w-full overflow-x-hidden text-pretty text-lg text-foreground">
          {children}
        </div>
        {adSlot ? <div className="mt-8 min-w-0 max-w-full">{adSlot}</div> : null}
      </article>
    </div>
  )
}
