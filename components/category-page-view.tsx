import Link from "next/link"

import { AdPlaceholder } from "@/components/news-landing"
import { SubscriptionGate } from "@/components/subscription-gate"
import { type Article, getArticlePath } from "@/lib/articles"
import { areSiteAdsEnabled } from "@/lib/site-ads-enabled"
import { formatArticleDate } from "@/lib/format-date"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

type CategoryPageViewProps = {
  activeId: string
  heroTitle: string
  kicker: string
  description: string
  feedHeading: string
  feedSubheading: string
  articles: Article[]
  categoryNameById: Record<string, string>
  isSubscribed: boolean
}

const FALLBACK_COVER =
  "https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev/landing/0f8e1a7b62c7f5cc2a650b40d8cd2168.jpg"

function labelForArticle(article: Article, categoryNameById: Record<string, string>) {
  const id = article.categoryIds[0]
  if (!id) return ar.uncategorized
  return categoryNameById[id] ?? ar.uncategorized
}

function CategoryArticleRow({
  article,
  categoryNameById,
  alternate,
  isSubscribed,
}: {
  article: Article
  categoryNameById: Record<string, string>
  alternate: boolean
  isSubscribed: boolean
}) {
  const imgSrc = article.coverImageUrl?.trim() || FALLBACK_COVER
  const label = labelForArticle(article, categoryNameById)

  return (
    <SubscriptionGate
      isMemberOnly={article.isMemberOnly}
      isSubscribed={isSubscribed}
      href={getArticlePath(article.id, article.title)}
      className={cn(
        "group flex cursor-pointer flex-col gap-6 md:flex-row md:gap-10 lg:gap-12",
        alternate && "md:flex-row-reverse",
      )}
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-3xl bg-neutral-100 md:w-[min(100%,380px)] md:max-w-[42%]">
        <img
          src={imgSrc}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center text-right">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500">
          <span className="rounded-full bg-neutral-100 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-indigo-800">
            {label}
          </span>
          <span aria-hidden className="text-neutral-300">
            ·
          </span>
          <time dateTime={article.date} className="text-xs">
            {formatArticleDate(article.date)}
          </time>
        </div>
        <h2 className="mt-3 text-pretty text-xl font-bold leading-snug text-neutral-900 transition-colors group-hover:text-neutral-700 md:text-2xl">
          {article.title}
        </h2>
        <p className="mt-3 line-clamp-3 text-pretty text-[15px] leading-relaxed text-neutral-600">
          {article.excerpt}
        </p>
      </div>
    </SubscriptionGate>
  )
}

export function CategoryPageView({
  activeId,
  heroTitle,
  kicker,
  description,
  feedSubheading,
  articles,
  categoryNameById,
  isSubscribed,
}: CategoryPageViewProps) {
  const mostRead = articles.slice(0, 3)
  const blurb = description.trim() || feedSubheading.trim()
  const showAds = areSiteAdsEnabled() && !isSubscribed

  return (
    <div dir="rtl" lang="ar" className="min-h-svh bg-white text-neutral-900">
      <div className="mx-auto w-full max-w-[90rem] px-4 py-12 sm:px-6 md:px-10 md:py-16 lg:px-8 lg:py-20 xl:px-8 2xl:px-10">
        <nav
          className="mb-8 flex flex-wrap items-center justify-end gap-2 text-sm text-neutral-500"
          aria-label={ar.categoryBreadcrumbAria}
        >
          <Link href="/" className="transition-colors hover:text-neutral-900">
            {ar.home}
          </Link>
          <span className="text-neutral-300" aria-hidden>
            /
          </span>
          <span className="font-medium text-neutral-900">{heroTitle}</span>
        </nav>

        <header className="mb-12 max-w-3xl text-right md:mb-14">
          <h1 className="text-pretty text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl lg:text-[2.5rem] lg:leading-tight">
            {heroTitle}
          </h1>
          {blurb ? (
            <p className="mt-4 text-pretty text-[15px] leading-relaxed text-neutral-600 md:text-base">
              {blurb}
            </p>
          ) : null}
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14 xl:gap-16">
          <div className="lg:col-span-8 xl:col-span-8">
            {articles.length === 0 ? (
              <p className="text-right text-neutral-600">{ar.noArticles}</p>
            ) : (
              <>
                <div className="space-y-0">
                  {articles.map((article, index) => (
                    <div
                      key={article.id}
                      className={cn(
                        "border-neutral-100 py-10 md:py-12",
                        index > 0 && "border-t",
                      )}
                    >
                      <CategoryArticleRow
                        article={article}
                        categoryNameById={categoryNameById}
                        alternate={index % 2 === 1}
                        isSubscribed={isSubscribed}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-center pt-12 md:pt-14">
                  <button
                    type="button"
                    className="rounded-full border border-neutral-900 bg-neutral-900 px-10 py-3.5 text-sm font-bold text-white transition-colors hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                  >
                    {ar.categoryLoadMore}
                  </button>
                </div>
              </>
            )}
          </div>

          <aside className="lg:col-span-4 xl:col-span-4">
            <div className="sticky top-28 space-y-8">
              <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm md:p-8">
                <h2 className="mb-6 border-b border-neutral-100 pb-4 text-right text-lg font-bold text-neutral-900">
                  {ar.categoryMostReadTitle}
                </h2>
                {mostRead.length === 0 ? (
                  <p className="text-right text-sm text-neutral-500">{ar.noArticles}</p>
                ) : (
                  <ul className="space-y-5">
                    {mostRead.map((a, i) => (
                      <li key={a.id} className="flex gap-3 text-right">
                        <span className="w-8 shrink-0 pt-0.5 text-2xl font-bold tabular-nums text-neutral-200">
                          {i + 1}
                        </span>
                        <SubscriptionGate
                          isMemberOnly={a.isMemberOnly}
                          isSubscribed={isSubscribed}
                          href={getArticlePath(a.id, a.title)}
                          className="min-w-0 text-pretty text-sm font-bold leading-snug text-neutral-900 transition-colors hover:text-neutral-600"
                        >
                          {a.title}
                        </SubscriptionGate>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {showAds ? (
                <AdPlaceholder text="" />
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
