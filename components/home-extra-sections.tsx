import Image from "next/image"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { SubscriptionGate } from "@/components/subscription-gate"
import { formatRelativeAr } from "@/lib/format-date"
import { getArticlePath } from "@/lib/site-routes"
import type { FeedArticle } from "@/lib/site-types"

/* Same container and heading scale as HomeTopicCarousel so the new blocks sit in the same grid. */
const WRAP = "mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8 xl:px-8 2xl:px-10"
const H2 = "text-pretty text-right text-2xl font-bold tracking-tight md:text-3xl"

type Common = { isSubscribed: boolean; categoryName?: (a: FeedArticle) => string | undefined }

const faNum = new Intl.NumberFormat("ar-EG")

function Cover({ article, sizes, className = "" }: { article: FeedArticle; sizes: string; className?: string }) {
  const pos = className.includes("absolute") ? "" : "relative"
  if (!article.coverImageUrl) return <div className={`bg-neutral-200 ${pos} ${className}`} />
  return (
    <div className={`${pos} overflow-hidden bg-neutral-200 ${className}`}>
      <Image
        src={article.coverImageUrl}
        alt={article.title}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        // Unoptimized: no Images binding; legacy covers hot-link source CDNs that 403 the server-side optimizer.
        unoptimized
      />
    </div>
  )
}

/** «يتصدر الآن»: five big numbers on a soft grey panel. */
export function HomeTrending({ items, title, isSubscribed, categoryName }: Common & { items: FeedArticle[]; title: string }) {
  if (items.length < 3) return null
  return (
    <section dir="rtl" lang="ar" aria-labelledby="home-trending" className="py-6 md:py-10">
      <div className={WRAP}>
        <div className="rounded-[2rem] bg-neutral-100 px-5 py-8 md:px-10 md:py-12">
          <h2 id="home-trending" className={`${H2} mb-8 text-black md:mb-10`}>
            {title}
          </h2>
          <ol className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-5">
            {items.slice(0, 5).map((a, i) => (
              <li key={a.id}>
                <SubscriptionGate
                  isMemberOnly={a.isMemberOnly}
                  isSubscribed={isSubscribed}
                  href={getArticlePath(a.id, a.title)}
                  className="group flex gap-4 text-right lg:block"
                >
                  <span
                    aria-hidden
                    className="block shrink-0 text-6xl font-black leading-none text-neutral-300 transition-colors duration-300 group-hover:text-black lg:mb-4 lg:text-7xl"
                  >
                    {faNum.format(i + 1)}
                  </span>
                  <span className="block min-w-0 space-y-2">
                    <span className="block text-xs font-bold text-neutral-500">{categoryName?.(a)}</span>
                    <span className="line-clamp-4 block text-[17px] font-extrabold leading-snug text-neutral-900 group-hover:underline lg:text-lg">
                      {a.title}
                    </span>
                    <span className="block text-xs text-neutral-400">{formatRelativeAr(a.publishedAt)}</span>
                  </span>
                </SubscriptionGate>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/** «قراءات معمّقة»: a dark full-width band that breaks the white rhythm (long stories). */
export function HomeLongReads({ items, title, subtitle, isSubscribed, categoryName }: Common & { items: FeedArticle[]; title: string; subtitle: string }) {
  if (items.length < 3) return null
  return (
    <section dir="rtl" lang="ar" aria-labelledby="home-longreads" className="py-6 md:py-10">
      <div className={WRAP}>
        <div className="rounded-[2rem] bg-black px-5 py-9 text-white md:px-10 md:py-14">
          <div className="mb-8 md:mb-10">
            <h2 id="home-longreads" className={`${H2} text-white`}>
              {title}
            </h2>
            <p className="mt-2 text-right text-sm text-white/60 md:text-base">{subtitle}</p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {items.slice(0, 4).map((a) => {
              const minutes = Math.max(2, Math.round((a.bodyLength ?? 0) / 1500))
              return (
                <article key={a.id} className="text-right">
                  <SubscriptionGate
                    isMemberOnly={a.isMemberOnly}
                    isSubscribed={isSubscribed}
                    href={getArticlePath(a.id, a.title)}
                    className="group block"
                  >
                    <Cover article={a} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 24vw" className="aspect-[4/3] rounded-2xl" />
                    <span className="mt-4 block text-xs font-bold text-white/55">
                      {categoryName?.(a)} · قراءة {faNum.format(minutes)} د
                    </span>
                    <span className="mt-1.5 line-clamp-3 block text-lg font-extrabold leading-snug group-hover:underline">{a.title}</span>
                  </SubscriptionGate>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/** «بالصور»: asymmetric photo mosaic, headline on the image. */
export function HomePhotoMosaic({ items, title, isSubscribed }: Common & { items: FeedArticle[]; title: string }) {
  if (items.length < 5) return null
  const [big, ...small] = items
  const tile = "group relative block h-full w-full overflow-hidden rounded-3xl"
  const caption = (a: FeedArticle, large: boolean) => (
    <>
      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" aria-hidden />
      <span
        className={`absolute inset-x-0 bottom-0 line-clamp-3 block p-4 text-right font-extrabold leading-snug text-white ${large ? "text-xl md:p-7 md:text-3xl" : "text-sm md:p-5 md:text-base"}`}
      >
        {a.title}
      </span>
    </>
  )
  return (
    <section dir="rtl" lang="ar" aria-labelledby="home-photos" className="py-10 md:py-14">
      <div className={WRAP}>
        <h2 id="home-photos" className={`${H2} mb-8 text-black`}>
          {title}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:h-[34rem] lg:grid-cols-4 lg:grid-rows-2">
          <div className="col-span-2 h-72 lg:h-auto lg:row-span-2">
            <SubscriptionGate isMemberOnly={big.isMemberOnly} isSubscribed={isSubscribed} href={getArticlePath(big.id, big.title)} className={tile}>
              <Cover article={big} sizes="(max-width: 1024px) 100vw, 50vw" className="absolute inset-0" />
              {caption(big, true)}
            </SubscriptionGate>
          </div>
          {small.slice(0, 4).map((a) => (
            <div key={a.id} className="h-44 lg:h-auto">
              <SubscriptionGate isMemberOnly={a.isMemberOnly} isSubscribed={isSubscribed} href={getArticlePath(a.id, a.title)} className={tile}>
                <Cover article={a} sizes="(max-width: 1024px) 50vw, 25vw" className="absolute inset-0" />
                {caption(a, false)}
              </SubscriptionGate>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export type TrioColumn = { id: string; title: string; href: string; articles: FeedArticle[] }

/** Three categories side by side: one image story + three headlines each, on soft panels. */
export function HomeCategoryTrio({ columns, moreLabel, isSubscribed }: { columns: TrioColumn[]; moreLabel: string; isSubscribed: boolean }) {
  const cols = columns.filter((c) => c.articles.length >= 2)
  if (cols.length === 0) return null
  return (
    <section dir="rtl" lang="ar" aria-label="أقسام" className="py-10 md:py-14">
      <div className={WRAP}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {cols.map((c) => {
            const [lead, ...rest] = c.articles
            return (
              <div key={c.id} className="rounded-[2rem] bg-neutral-50 p-5 text-right md:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-black md:text-2xl">{c.title}</h2>
                  <Link href={c.href} className="inline-flex items-center gap-0.5 text-sm font-bold text-neutral-700 hover:text-black">
                    {moreLabel}
                    <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
                <SubscriptionGate isMemberOnly={lead.isMemberOnly} isSubscribed={isSubscribed} href={getArticlePath(lead.id, lead.title)} className="group block">
                  <Cover article={lead} sizes="(max-width: 768px) 100vw, 30vw" className="aspect-[16/10] rounded-2xl" />
                  <span className="mt-4 line-clamp-3 block text-lg font-extrabold leading-snug text-neutral-900 group-hover:underline">{lead.title}</span>
                </SubscriptionGate>
                <ul className="mt-5 space-y-4">
                  {rest.slice(0, 3).map((a) => (
                    <li key={a.id}>
                      <Link href={getArticlePath(a.id, a.title)} className="line-clamp-2 text-[15px] font-bold leading-snug text-neutral-700 hover:text-black hover:underline">
                        {a.title}
                      </Link>
                      <span className="mt-1 block text-xs text-neutral-400">{formatRelativeAr(a.publishedAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
