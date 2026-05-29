import Image from "next/image"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { SubscriptionGate } from "@/components/subscription-gate"
import { getArticlePath } from "@/lib/site-routes"
import type { FeedArticle } from "@/lib/site-types"
import { formatArticleDate } from "@/lib/format-date"
import { cn } from "@/lib/utils"

type Props = {
  featured: FeedArticle | null
  side: FeedArticle | null
  row: FeedArticle | null
  isSubscribed: boolean
}

function ArticleCard({
  article,
  sizes,
  size = "small",
  isSubscribed,
}: {
  article: FeedArticle
  sizes: string
  size?: "large" | "small"
  isSubscribed: boolean
}) {
  return (
    <article className="flex flex-col gap-4">
      <SubscriptionGate
        isMemberOnly={article.isMemberOnly}
        isSubscribed={isSubscribed}
        href={getArticlePath(article.id, article.title)}
        className="group block"
      >
        <div className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-3xl bg-neutral-100">
          {article.coverImageUrl ? (
            <Image
              src={article.coverImageUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes={sizes}
              priority={size === "large"}
            />
          ) : null}
        </div>
      </SubscriptionGate>
      <div className="space-y-2 px-1">
        <h2
          className={cn(
            "cursor-pointer font-extrabold leading-[1.1] text-gray-900 decoration-2 underline-offset-4 hover:underline",
            size === "large" ? "text-2xl md:text-4xl" : "text-xl",
          )}
        >
          <Link href={getArticlePath(article.id, article.title)} className="block">
            {article.title}
          </Link>
        </h2>
        <p
          className={cn(
            "text-[15px] leading-relaxed text-gray-600",
            size === "large" ? "line-clamp-4" : "line-clamp-3",
          )}
        >
          {article.excerpt}
        </p>
        <div className="flex items-center gap-2 pt-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
            <ExternalLink className="h-3 w-3 text-gray-500" aria-hidden />
          </div>
          <span className="text-[13px] font-bold text-gray-700">
            <span className="font-medium text-gray-400">{formatArticleDate(article.date)}</span>
          </span>
        </div>
      </div>
    </article>
  )
}

export function HomeHeroSection({ featured, side, row, isSubscribed }: Props) {
  return (
    <section dir="rtl" lang="ar" className="bg-white">
      <div className="mx-auto max-w-[90rem] px-6 py-8 md:px-12 md:py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            {featured ? (
              <ArticleCard
                size="large"
                article={featured}
                isSubscribed={isSubscribed}
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-12 lg:col-span-5">
            {side ? (
              <ArticleCard
                article={side}
                isSubscribed={isSubscribed}
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            ) : null}

            {row ? (
              <div className="flex gap-4 border-t border-gray-100 pt-4 md:gap-6">
                <SubscriptionGate
                  isMemberOnly={row.isMemberOnly}
                  isSubscribed={isSubscribed}
                  href={getArticlePath(row.id, row.title)}
                  className="relative w-1/3 shrink-0 overflow-hidden rounded-2xl bg-neutral-100 aspect-square"
                >
                  {row.coverImageUrl ? (
                    <Image
                      src={row.coverImageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 200px"
                    />
                  ) : null}
                </SubscriptionGate>
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className="cursor-pointer text-lg font-extrabold leading-tight text-gray-900 hover:underline">
                    <Link href={getArticlePath(row.id, row.title)} className="block">
                      {row.title}
                    </Link>
                  </h3>
                  <p className="line-clamp-2 text-[14px] leading-relaxed text-gray-600">
                    {row.excerpt}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <ExternalLink className="h-3 w-3 text-gray-500" aria-hidden />
                    </div>
                    <span className="text-[12px] font-bold leading-none text-gray-500">
                      <span className="font-medium text-gray-400">{formatArticleDate(row.date)}</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
