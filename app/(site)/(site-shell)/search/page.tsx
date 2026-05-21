import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

import { SubscriptionGate } from "@/components/subscription-gate"
import { formatArticleDate } from "@/lib/format-date"
import { getCategories } from "@/lib/categories"
import { getPublishedArticles } from "@/lib/db-public-articles.server"
import { getArticlePath } from "@/lib/articles"
import { isSubscribed } from "@/lib/subscription"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const FALLBACK_COVER =
  "https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev/landing/0f8e1a7b62c7f5cc2a650b40d8cd2168.jpg"

export const metadata: Metadata = {
  title: ar.searchMetaTitle,
  description: ar.searchMetaDescription,
}

type PageProps = {
  searchParams?: Promise<{ q?: string }>
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {}
  const query = (sp.q ?? "").trim()
  const normalizedQuery = normalize(query)
  const [articles, categories, subscribed] = await Promise.all([
    getPublishedArticles(),
    getCategories(),
    isSubscribed(),
  ])
  const categoryNameById = Object.fromEntries(
    categories.map((category) => [category.id, category.name]),
  )

  const filteredArticles = normalizedQuery
    ? articles.filter((article) => {
        const haystack = normalize(
          [article.title, article.excerpt, article.id].join(" "),
        )
        return haystack.includes(normalizedQuery)
      })
    : []

  const suggestions = articles.slice(0, 6)

  return (
    <section className="min-h-0 min-w-0 flex-1 bg-[linear-gradient(180deg,#fff_0%,#fafafa_100%)]">
      <section
        dir="rtl"
        lang="ar"
        className="mx-auto w-full max-w-[90rem] px-4 py-12 sm:px-6 md:px-10 md:py-16 lg:px-8 lg:py-20"
      >
        <div className="mx-auto max-w-4xl">
          <span className="mb-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            {ar.searchKicker}
          </span>
          <h1 className="text-pretty text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
            {ar.searchTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600 md:text-base">
            {ar.searchDescription}
          </p>

          <form className="mt-8" action="/search" method="get">
            <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center">
              <input
                name="q"
                defaultValue={query}
                placeholder={ar.searchPlaceholder}
                className="h-14 flex-1 rounded-[1.4rem] border-0 bg-slate-50 px-5 text-right text-[15px] text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300"
              />
              <button
                type="submit"
                className="h-14 rounded-[1.4rem] bg-slate-950 px-8 text-sm font-bold text-white transition-colors hover:bg-slate-800"
              >
                {ar.searchButton}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-950">
                  {ar.searchResultsLabel}
                </h2>
                {query ? <span className="text-sm text-slate-500">{query}</span> : null}
              </div>

              {!query ? (
                <p className="text-sm leading-7 text-slate-500">
                  {ar.searchEmptyState}
                </p>
              ) : filteredArticles.length === 0 ? (
                <p className="text-sm leading-7 text-slate-500">
                  {ar.searchNoResults}
                </p>
              ) : (
                <ul className="space-y-4">
                  {filteredArticles.map((article) => {
                    const categoryLabel = article.categoryIds[0]
                      ? categoryNameById[article.categoryIds[0]] ?? ar.uncategorized
                      : ar.uncategorized
                    const coverImageUrl =
                      article.coverImageUrl?.trim() || FALLBACK_COVER

                    return (
                      <li key={article.id}>
                      <SubscriptionGate
                        isMemberOnly={article.isMemberOnly}
                        isSubscribed={subscribed}
                        href={getArticlePath(article.id, article.title)}
                        className={cn(
                          "group flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 p-4 transition",
                          "hover:border-slate-300 hover:bg-slate-50 md:flex-row md:items-stretch",
                        )}
                      >
                          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.2rem] bg-slate-100 md:w-48 md:shrink-0">
                            <Image
                              src={coverImageUrl}
                              alt=""
                              fill
                              sizes="(min-width: 768px) 12rem, 100vw"
                              className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
                            />
                          </div>
                          <div className="min-w-0 flex-1 text-right">
                            <div
                              dir="rtl"
                              className="flex w-full flex-wrap items-center justify-start gap-2 text-xs font-medium text-slate-500"
                            >
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                                {categoryLabel}
                              </span>
                              <time dateTime={article.date}>
                                {formatArticleDate(article.date)}
                              </time>
                            </div>
                            <h3 className="mt-3 text-xl font-bold leading-snug text-slate-950">
                              {article.title}
                            </h3>
                            <p className="mt-2 text-sm leading-7 text-slate-600">
                              {article.excerpt}
                            </p>
                          </div>
                        </SubscriptionGate>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-28 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <h2 className="text-lg font-bold text-slate-950">
                {ar.searchSuggestedTitle}
              </h2>
              <ul className="mt-5 space-y-4">
                {suggestions.map((article) => (
                  <li key={article.id}>
                    <SubscriptionGate
                      isMemberOnly={article.isMemberOnly}
                      isSubscribed={subscribed}
                      href={getArticlePath(article.id, article.title)}
                      className="block rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
                    >
                      <div dir="rtl" className="text-xs text-slate-500">
                        {article.categoryIds[0]
                          ? categoryNameById[article.categoryIds[0]] ?? ar.uncategorized
                          : ar.uncategorized}
                      </div>
                      <div className="mt-1 text-sm font-bold leading-6 text-slate-900">
                        {article.title}
                      </div>
                    </SubscriptionGate>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </section>
  )
}
