import Link from "next/link"

import { getArticlePath, type Article } from "@/lib/articles"
import { formatArticleDate } from "@/lib/format-date"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

type ArticleFeedProps = {
  articles: Article[]
  heading: string
  subheading: string
  /** Resolved category names for chip labels (RTL). */
  categoryNameById: Record<string, string>
}

const cardClassName = cn(
  "block rounded-lg border border-border/80 bg-card p-5 text-card-foreground transition-colors",
  "hover:border-foreground/20 hover:shadow-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
)

export function ArticleFeed({
  articles,
  heading,
  subheading,
  categoryNameById,
}: ArticleFeedProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h2 className="text-lg font-semibold">{heading}</h2>
      <p className="text-sm text-muted-foreground">{subheading}</p>

      {articles.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{ar.noArticles}</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {articles.map((article) => (
            <li key={article.id}>
              <Link
                href={getArticlePath(article.id)}
                className={cardClassName}
              >
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  {article.categoryIds.length > 0 ? (
                    article.categoryIds.map((cid) => (
                      <span
                        key={cid}
                        className="rounded bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-foreground"
                      >
                        {categoryNameById[cid] ?? cid}
                      </span>
                    ))
                  ) : (
                    <span className="text-[0.7rem]">{ar.uncategorized}</span>
                  )}
                  <span aria-hidden>·</span>
                  <time dateTime={article.date}>
                    {formatArticleDate(article.date)}
                  </time>
                </div>
                <h3 className="mt-2 text-base font-semibold leading-snug">{article.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
