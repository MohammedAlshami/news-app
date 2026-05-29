import Image from "next/image"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Amiri } from "next/font/google"

import { SubscriptionGate } from "@/components/subscription-gate"
import { ALL_CATEGORIES_ID, getArticlePath, getCategoryPagePath } from "@/lib/site-routes"
import type { FeedArticle } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

const headingSerif = Amiri({
  subsets: ["arabic"],
  weight: ["700"],
  display: "swap",
})

type Props = {
  articles: FeedArticle[]
  isSubscribed: boolean
}

export function HomeCampusNewsSection({ articles, isSubscribed }: Props) {
  const allNewsHref = getCategoryPagePath(ALL_CATEGORIES_ID)
  const featured = articles[0] ?? null
  const side = articles.slice(1, 4)

  return (
    <section dir="rtl" lang="ar" className="bg-white py-12 md:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8 xl:px-8 2xl:px-10">
        <header className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between lg:mb-12">
          <h2
            className={cn(
              headingSerif.className,
              "text-pretty text-right text-3xl leading-tight text-neutral-900 md:text-4xl lg:text-[2.5rem]",
            )}
          >
            {ar.homeCampusNewsTitle}
          </h2>
          <Link
            href={allNewsHref}
            className="inline-flex shrink-0 items-center gap-2 self-end text-sm font-medium text-neutral-700 transition-colors hover:text-black sm:self-auto"
          >
            <span>{ar.homeCampusNewsSeeAll}</span>
            <ChevronLeft className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-10 xl:gap-12">
          {featured ? (
            <article className="flex flex-col lg:col-span-3">
              <SubscriptionGate
                isMemberOnly={featured.isMemberOnly}
                isSubscribed={isSubscribed}
                href={getArticlePath(featured.id, featured.title)}
                className="group block"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-200">
                  {featured.coverImageUrl ? (
                    <Image
                      src={featured.coverImageUrl}
                      alt=""
                      fill
                      priority
                      className="object-cover transition duration-500 group-hover:scale-[1.02]"
                      sizes="(max-width: 1024px) 100vw, 58vw"
                    />
                  ) : null}
                </div>
              </SubscriptionGate>
              <Link
                href={getArticlePath(featured.id, featured.title)}
                className="mt-5 block text-pretty text-right text-xl font-bold leading-snug text-neutral-900 transition hover:text-neutral-700 md:text-2xl"
              >
                {featured.title}
              </Link>
            </article>
          ) : null}

          <div className="flex flex-col gap-8 lg:col-span-2 lg:gap-7">
            {side.map((item) => (
              <article
                key={item.id}
                className="group border-b border-neutral-200 pb-8 last:border-0 last:pb-0 lg:pb-7"
              >
                <SubscriptionGate
                  isMemberOnly={item.isMemberOnly}
                  isSubscribed={isSubscribed}
                  href={getArticlePath(item.id, item.title)}
                  className="flex gap-4 sm:gap-5"
                >
                  <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-200 sm:h-28 sm:w-32">
                    {item.coverImageUrl ? (
                      <Image
                        src={item.coverImageUrl}
                        alt=""
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 112px, 128px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <h4 className="text-pretty text-base font-bold leading-snug text-neutral-900 transition group-hover:text-neutral-700 sm:text-lg">
                      {item.title}
                    </h4>
                    <p className="mt-2 line-clamp-3 text-pretty text-sm leading-relaxed text-neutral-600">
                      {item.excerpt}
                    </p>
                  </div>
                </SubscriptionGate>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
