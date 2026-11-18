import Image from "next/image"
import Link from "next/link"

import { SectionHeading, OverlayCard, StoryCard } from "@/components/home-hero"
import { SubscriptionGate } from "@/components/subscription-gate"
import { formatRelativeAr } from "@/lib/format-date"
import { getArticlePath } from "@/lib/site-routes"
import type { FeedArticle, SiteCategory } from "@/lib/site-types"

type Gate = { isSubscribed: boolean; categoryName?: (a: FeedArticle) => string | undefined }

/** Slim "latest headlines" strip right under the navbar. Scrolls sideways on phones. */
export function HomeBreakingBar({ items, allHref }: { items: FeedArticle[]; allHref: string }) {
  if (items.length === 0) return null
  return (
    <div dir="rtl" lang="ar" className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-[90rem] items-center gap-4 px-4 sm:px-6 md:px-12">
        <Link href={allHref} className="my-2.5 shrink-0 rounded-full bg-red-600 px-4 py-1.5 text-xs font-extrabold text-white">
          عاجل
        </Link>
        <nav aria-label="آخر العناوين" className="flex min-w-0 flex-1 items-center gap-8 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((a) => (
            <Link key={a.id} href={getArticlePath(a.id, a.title)} className="shrink-0 text-[13px] font-bold text-neutral-800 hover:underline">
              {a.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

/** Quick jump to every section. */
export function HomeCategoryChips({ categories, hrefFor, label }: { categories: SiteCategory[]; hrefFor: (slug: string) => string; label: string }) {
  if (categories.length === 0) return null
  return (
    <nav dir="rtl" lang="ar" aria-label={label} className="bg-white">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 md:px-12">
        <ul className="flex gap-2.5 overflow-x-auto border-y border-neutral-200 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <li key={c.id} className="shrink-0">
              <Link
                href={hrefFor(c.slug)}
                className="inline-block rounded-full border border-neutral-300 px-5 py-2 text-sm font-bold text-neutral-900 transition-colors hover:border-black hover:bg-black hover:text-white"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

/** "Most read": one big featured story plus a ranked list. Hidden until something has views. */
export function HomeTrending({ items, title, isSubscribed, categoryName }: Gate & { items: FeedArticle[]; title: string }) {
  if (items.length < 3) return null
  const [top, ...rest] = items
  return (
    <section dir="rtl" lang="ar" aria-labelledby="home-trending" className="bg-white">
      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 md:px-12 md:py-14">
        <SectionHeading id="home-trending">{title}</SectionHeading>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <OverlayCard
            className="lg:col-span-6"
            article={top}
            isSubscribed={isSubscribed}
            categoryName={categoryName}
            sizes="(max-width: 1024px) 100vw, 46vw"
          />
          <ol className="divide-y divide-neutral-100 lg:col-span-6">
            {rest.slice(0, 5).map((a, i) => (
              <li key={a.id} className="py-4 first:pt-0 last:pb-0">
                <SubscriptionGate
                  isMemberOnly={a.isMemberOnly}
                  isSubscribed={isSubscribed}
                  href={getArticlePath(a.id, a.title)}
                  className="group flex items-center gap-4"
                >
                  <span className="w-10 shrink-0 text-center text-4xl font-black leading-none text-neutral-200 transition-colors group-hover:text-black" aria-hidden>
                    {new Intl.NumberFormat("ar-EG").format(i + 2)}
                  </span>
                  <span className="min-w-0 flex-1 space-y-1 text-right">
                    <span className="block text-xs font-bold text-neutral-500">{categoryName?.(a)}</span>
                    <span className="line-clamp-2 block text-[17px] font-extrabold leading-snug text-neutral-900 group-hover:underline">{a.title}</span>
                    <span className="block text-xs text-neutral-400">{formatRelativeAr(a.publishedAt)}</span>
                  </span>
                  {a.coverImageUrl ? (
                    <span className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:block">
                      <Image src={a.coverImageUrl} alt="" fill sizes="112px" className="object-cover" unoptimized />
                    </span>
                  ) : null}
                </SubscriptionGate>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/** Category block: one big story and a grid of the next ones (used for the first categories). */
export function HomeCategorySpotlight({
  headingId,
  title,
  articles,
  href,
  moreLabel,
  isSubscribed,
}: {
  headingId: string
  title: string
  articles: FeedArticle[]
  href: string
  moreLabel: string
  isSubscribed: boolean
}) {
  if (articles.length < 3) return null
  const [lead, ...others] = articles
  return (
    <section dir="rtl" lang="ar" aria-labelledby={headingId} className="bg-white">
      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 md:px-12 md:py-14">
        <SectionHeading id={headingId} href={href} more={moreLabel}>
          {title}
        </SectionHeading>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <OverlayCard className="lg:col-span-6" article={lead} isSubscribed={isSubscribed} sizes="(max-width: 1024px) 100vw, 46vw" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-6">
            {others.slice(0, 4).map((a) => (
              <StoryCard key={a.id} article={a} isSubscribed={isSubscribed} sizes="(max-width: 640px) 100vw, 24vw" />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
