import Link from "next/link"

import { AdPlaceholder } from "@/components/news-landing"
import type { Article } from "@/lib/articles"
import { getArticlePath } from "@/lib/articles"
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
}: {
  article: Article
  categoryNameById: Record<string, string>
  alternate: boolean
}) {
  const imgSrc = article.coverImageUrl?.trim() || FALLBACK_COVER
  const label = labelForArticle(article, categoryNameById)

  return (
    <Link
      href={getArticlePath(article.id)}
      className={cn(
        "group flex cursor-pointer flex-col gap-8 md:flex-row",
        alternate && "md:flex-row-reverse",
      )}
    >
      <div className="overflow-hidden rounded-2xl bg-gray-100 md:w-1/3">
        <img
          src={imgSrc}
          alt=""
          className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="md:w-2/3">
        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-red-600">
          {label}
        </span>
        <h2 className="mb-3 text-2xl font-bold leading-tight transition group-hover:text-red-600">
          {article.title}
        </h2>
        <p className="mb-4 line-clamp-3 text-gray-500">{article.excerpt}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400">
          <time dateTime={article.date}>{formatArticleDate(article.date)}</time>
        </div>
      </div>
    </Link>
  )
}

export function CategoryPageView({
  activeId: _activeId,
  heroTitle,
  description,
  feedSubheading,
  articles,
  categoryNameById,
}: CategoryPageViewProps) {
  const mostRead = articles.slice(0, 3)
  const blurb = description.trim() || feedSubheading.trim()

  return (
    <div className="min-h-svh bg-white text-[#1a1a1a]">
      <div className="container mx-auto px-4 py-12">
        <nav
          className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-400"
          aria-label="مسار التنقل"
        >
          <Link href="/" className="transition-colors hover:text-black">
            {ar.home}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-black">{heroTitle}</span>
        </nav>

        <h1 className="mb-4 text-4xl font-bold">{heroTitle}</h1>
        <p className="max-w-2xl text-gray-500">{blurb}</p>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            {articles.length === 0 ? (
              <p className="text-gray-500">{ar.noArticles}</p>
            ) : (
              <>
                <div className="space-y-12">
                  {articles.map((article, index) => (
                    <div
                      key={article.id}
                      className={cn(index > 0 && "border-t border-gray-100 pt-12")}
                    >
                      <CategoryArticleRow
                        article={article}
                        categoryNameById={categoryNameById}
                        alternate={index % 2 === 1}
                      />
                    </div>
                  ))}
                </div>
                <div className="pt-12 text-center">
                  <button
                    type="button"
                    className="rounded-lg border border-black px-8 py-3 font-bold transition-colors hover:bg-black hover:text-white"
                  >
                    تحميل المزيد من المقالات
                  </button>
                </div>
              </>
            )}
          </div>

          <aside className="space-y-8 lg:col-span-1">
            <div className="rounded-2xl bg-gray-50 p-6">
              <h4 className="mb-4 border-b border-gray-200 pb-2 font-bold">
                الأكثر قراءة في هذا القسم
              </h4>
              {mostRead.length === 0 ? (
                <p className="text-sm text-gray-500">{ar.noArticles}</p>
              ) : (
                <ul className="space-y-4">
                  {mostRead.map((a, i) => (
                    <li key={a.id} className="flex gap-3">
                      <span className="text-2xl font-bold text-gray-200 tabular-nums">
                        {i + 1}
                      </span>
                      <Link
                        href={getArticlePath(a.id)}
                        className="text-sm font-bold leading-snug text-foreground transition-colors hover:text-red-600"
                      >
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <AdPlaceholder text="إعلان جانبي" className="h-64 rounded-2xl" />
          </aside>
        </div>
      </div>
    </div>
  )
}
