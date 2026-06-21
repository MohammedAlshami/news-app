import Image from "next/image"
import Link from "next/link"

import { getArticlePath } from "@/lib/site-routes"
import { formatArticleDate } from "@/lib/format-date"
import { ar } from "@/lib/ui-ar"

type Article = {
  id: string
  title: string
  excerpt: string
  date: string
  categoryIds: string[]
  coverImageUrl?: string | null
  isMemberOnly: boolean
}

type Props = {
  articles: Article[]
}

export function RecommendedArticles({ articles }: Props) {
  if (articles.length === 0) return null

  return (
    <section
      dir="rtl"
      lang="ar"
      className="mx-auto w-full max-w-[90rem] px-4 py-16 sm:px-6 md:px-10 md:py-20"
    >
      <h2 className="mb-8 text-right text-2xl font-bold text-neutral-900 md:text-3xl">
        {"مقالات مقترحة"}
      </h2>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => {
          const imgSrc = article.coverImageUrl?.trim()
          if (!imgSrc) return null
          return (
            <Link
              key={article.id}
              href={getArticlePath(article.id)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-transform duration-300 hover:scale-[1.02]"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
                <Image
                  src={imgSrc}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  unoptimized
                />
              </div>
              <div className="flex flex-1 flex-col p-4 text-right">
                <h3 className="line-clamp-2 text-base font-bold leading-snug text-neutral-900 transition-colors group-hover:text-neutral-700">
                  {article.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-600">
                  {article.excerpt}
                </p>
                <time className="mt-auto pt-3 text-xs text-neutral-400">
                  {formatArticleDate(article.date)}
                </time>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}