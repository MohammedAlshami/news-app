import Image from "next/image"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { SubscriptionGate } from "@/components/subscription-gate"
import { formatRelativeAr } from "@/lib/format-date"
import { getArticlePath } from "@/lib/site-routes"
import type { FeedArticle, SiteAdPublic } from "@/lib/site-types"

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

/** «قراءات معمّقة»: dark-grey panel, one big story plus three rows with reading time. */
export function HomeLongReads({ items, title, subtitle, isSubscribed, categoryName }: Common & { items: FeedArticle[]; title: string; subtitle: string }) {
  if (items.length < 4) return null
  const [lead, ...rest] = items
  const minutes = (a: FeedArticle) => Math.max(2, Math.round((a.bodyLength ?? 0) / 1500))
  return (
    <section dir="rtl" lang="ar" aria-labelledby="home-longreads" className="py-6 md:py-10">
      <div className={WRAP}>
        <div className="rounded-[2rem] bg-neutral-800 px-5 py-8 text-white md:px-10 md:py-12">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-2 md:mb-9">
            <h2 id="home-longreads" className={`${H2} text-white`}>
              {title}
            </h2>
            <p className="text-sm text-neutral-400 md:text-base">{subtitle}</p>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
            <article className="lg:col-span-7">
              <SubscriptionGate isMemberOnly={lead.isMemberOnly} isSubscribed={isSubscribed} href={getArticlePath(lead.id, lead.title)} className="group block text-right">
                <Cover article={lead} sizes="(max-width: 1024px) 100vw, 56vw" className="aspect-[16/10] rounded-3xl" />
                <span className="mt-5 block text-xs font-bold text-neutral-400">
                  {categoryName?.(lead)} · قراءة {faNum.format(minutes(lead))} د
                </span>
                <span className="mt-2 line-clamp-3 block text-2xl font-extrabold leading-snug group-hover:underline md:text-3xl">{lead.title}</span>
                <span className="mt-3 line-clamp-2 block text-[15px] leading-relaxed text-neutral-300">{lead.excerpt}</span>
              </SubscriptionGate>
            </article>
            <ul className="flex flex-col gap-3 lg:col-span-5">
              {rest.slice(0, 3).map((a) => (
                <li key={a.id}>
                  <SubscriptionGate
                    isMemberOnly={a.isMemberOnly}
                    isSubscribed={isSubscribed}
                    href={getArticlePath(a.id, a.title)}
                    className="group flex items-center gap-4 rounded-2xl p-3 text-right transition-colors hover:bg-white/10"
                  >
                    <Cover article={a} sizes="160px" className="h-24 w-32 shrink-0 rounded-xl sm:h-28 sm:w-40" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-neutral-400">
                        {categoryName?.(a)} · قراءة {faNum.format(minutes(a))} د
                      </span>
                      <span className="mt-1 line-clamp-3 block text-base font-extrabold leading-snug md:text-lg">{a.title}</span>
                    </span>
                  </SubscriptionGate>
                </li>
              ))}
            </ul>
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

const isExternal = (h: string) => /^https?:\/\//i.test(h)

/**
 * «مقالات مميزة»: sponsored placements first (active home ads that have an image, labelled «برعاية»),
 * topped up with editor-style picks (labelled «مميز») so the block is never empty.
 */
export function HomeFeatured({
  ads,
  picks,
  title,
  isSubscribed,
}: {
  ads: SiteAdPublic[]
  picks: FeedArticle[]
  title: string
  isSubscribed: boolean
}) {
  type Card = { key: string; href: string; img: string | null; title: string; sponsored: boolean; external: boolean; memberOnly: boolean }
  const cards: Card[] = [
    ...ads.slice(0, 3).map((ad) => ({
      key: `ad-${ad.id}`,
      href: ad.href,
      img: ad.imageUrl,
      title: ad.name || "إعلان",
      sponsored: true,
      external: isExternal(ad.href),
      memberOnly: false,
    })),
    ...picks.map((a) => ({
      key: a.id,
      href: getArticlePath(a.id, a.title),
      img: a.coverImageUrl ?? null,
      title: a.title,
      sponsored: false,
      external: false,
      memberOnly: a.isMemberOnly,
    })),
  ].slice(0, 3)
  if (cards.length < 3) return null
  const [first, ...others] = cards

  const body = (c: Card, large: boolean) => (
    <>
      {c.img ? (
        <Image src={c.img} alt="" fill sizes={large ? "(max-width: 1024px) 100vw, 55vw" : "(max-width: 1024px) 100vw, 28vw"} className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
      ) : null}
      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" aria-hidden />
      <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-black md:right-6 md:top-6">
        {c.sponsored ? "برعاية" : "مميز"}
      </span>
      <span className={`absolute inset-x-0 bottom-0 line-clamp-3 block p-5 text-right font-extrabold leading-snug text-white md:p-7 ${large ? "text-2xl md:text-3xl" : "text-lg md:text-xl"}`}>
        {c.title}
      </span>
    </>
  )
  const frame = "group relative block h-full w-full overflow-hidden rounded-3xl bg-neutral-300"
  const link = (c: Card, large: boolean) =>
    c.sponsored || c.external ? (
      <a href={c.href} target="_blank" rel="sponsored noopener noreferrer" className={frame}>
        {body(c, large)}
      </a>
    ) : (
      <SubscriptionGate isMemberOnly={c.memberOnly} isSubscribed={isSubscribed} href={c.href} className={frame}>
        {body(c, large)}
      </SubscriptionGate>
    )

  return (
    <section dir="rtl" lang="ar" aria-labelledby="home-featured" className="py-10 md:py-14">
      <div className={WRAP}>
        <div className="mb-8 flex items-end justify-between">
          <h2 id="home-featured" className={`${H2} text-black`}>
            {title}
          </h2>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-500">محتوى مميز</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:gap-5 lg:h-[30rem] lg:grid-cols-12">
          <div className="h-72 lg:col-span-7 lg:h-auto">{link(first, true)}</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:col-span-5 lg:grid-cols-1">
            {others.map((c) => (
              <div key={c.key} className="h-56 lg:h-auto">
                {link(c, false)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * A category with its own block. `split`: one big story + a column of thumbnail rows;
 * `row`: three big cards across with a headline list under them. `tone` picks the surface.
 */
export function HomeCategoryFeature({
  id,
  title,
  href,
  moreLabel,
  articles,
  variant,
  tone,
  isSubscribed,
}: {
  id: string
  title: string
  href: string
  moreLabel: string
  articles: FeedArticle[]
  variant: "split" | "row"
  tone: "plain" | "soft" | "dark"
  isSubscribed: boolean
}) {
  if (articles.length < 4) return null
  const dark = tone === "dark"
  const surface = tone === "soft" ? "bg-neutral-100" : dark ? "bg-neutral-800" : ""
  const ink = dark ? "text-white" : "text-neutral-900"
  const sub = dark ? "text-neutral-400" : "text-neutral-500"
  const pad = tone === "plain" ? "" : "rounded-[2rem] px-5 py-8 md:px-10 md:py-12"
  const [lead, ...rest] = articles

  const head = (
    <div className="mb-7 flex items-center justify-between md:mb-9">
      <h2 id={id} className={`${H2} ${dark ? "text-white" : "text-black"}`}>
        {title}
      </h2>
      <Link href={href} className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${dark ? "bg-white/10 text-white hover:bg-white/20" : "bg-neutral-900 text-white hover:bg-neutral-700"}`}>
        {moreLabel}
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  )

  return (
    <section dir="rtl" lang="ar" aria-labelledby={id} className="py-6 md:py-10">
      <div className={WRAP}>
        <div className={`${surface} ${pad}`}>
          {head}
          {variant === "split" ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
              <article className="lg:col-span-7">
                <SubscriptionGate isMemberOnly={lead.isMemberOnly} isSubscribed={isSubscribed} href={getArticlePath(lead.id, lead.title)} className="group block text-right">
                  <Cover article={lead} sizes="(max-width: 1024px) 100vw, 56vw" className="aspect-[16/10] rounded-3xl" />
                  <span className={`mt-5 line-clamp-3 block text-2xl font-extrabold leading-snug group-hover:underline md:text-3xl ${ink}`}>{lead.title}</span>
                  <span className={`mt-2 block text-xs ${sub}`}>{formatRelativeAr(lead.publishedAt)}</span>
                </SubscriptionGate>
              </article>
              <ul className="flex flex-col gap-3 lg:col-span-5">
                {rest.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <SubscriptionGate
                      isMemberOnly={a.isMemberOnly}
                      isSubscribed={isSubscribed}
                      href={getArticlePath(a.id, a.title)}
                      className={`group flex items-center gap-4 rounded-2xl p-2.5 text-right transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                    >
                      <Cover article={a} sizes="144px" className="h-20 w-28 shrink-0 rounded-xl sm:h-24 sm:w-36" />
                      <span className="min-w-0 flex-1">
                        <span className={`line-clamp-3 block text-base font-extrabold leading-snug ${ink}`}>{a.title}</span>
                        <span className={`mt-1 block text-xs ${sub}`}>{formatRelativeAr(a.publishedAt)}</span>
                      </span>
                    </SubscriptionGate>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
                {articles.slice(0, 3).map((a) => (
                  <article key={a.id} className="text-right">
                    <SubscriptionGate isMemberOnly={a.isMemberOnly} isSubscribed={isSubscribed} href={getArticlePath(a.id, a.title)} className="group block">
                      <Cover article={a} sizes="(max-width: 768px) 100vw, 30vw" className="aspect-[4/3] rounded-3xl" />
                      <span className={`mt-4 line-clamp-3 block text-lg font-extrabold leading-snug group-hover:underline md:text-xl ${ink}`}>{a.title}</span>
                      <span className={`mt-1.5 block text-xs ${sub}`}>{formatRelativeAr(a.publishedAt)}</span>
                    </SubscriptionGate>
                  </article>
                ))}
              </div>
              {articles.length > 3 ? (
                <ul className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                  {articles.slice(3, 7).map((a) => (
                    <li key={a.id} className="text-right">
                      <Link href={getArticlePath(a.id, a.title)} className={`line-clamp-2 text-[15px] font-bold leading-snug hover:underline ${dark ? "text-neutral-200" : "text-neutral-700"}`}>
                        {a.title}
                      </Link>
                      <span className={`mt-1 block text-xs ${sub}`}>{formatRelativeAr(a.publishedAt)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/** «اختيارنا لك»: two very large image cards side by side. */
export function HomeSpotlightPair({ items, title, isSubscribed, categoryName }: Common & { items: FeedArticle[]; title: string }) {
  if (items.length < 2) return null
  return (
    <section dir="rtl" lang="ar" aria-labelledby="home-spotlight" className="py-10 md:py-14">
      <div className={WRAP}>
        <h2 id="home-spotlight" className={`${H2} mb-8 text-black`}>
          {title}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {items.slice(0, 2).map((a) => (
            <article key={a.id}>
              <SubscriptionGate isMemberOnly={a.isMemberOnly} isSubscribed={isSubscribed} href={getArticlePath(a.id, a.title)} className="group relative block overflow-hidden rounded-3xl">
                <Cover article={a} sizes="(max-width: 768px) 100vw, 48vw" className="aspect-[16/10]" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden />
                <span className="absolute inset-x-0 bottom-0 block space-y-2 p-5 text-right text-white md:p-8">
                  <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-extrabold text-black">{categoryName?.(a)}</span>
                  <span className="line-clamp-3 block text-xl font-extrabold leading-snug md:text-2xl">{a.title}</span>
                </span>
              </SubscriptionGate>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/** «آخر الأخبار»: dense two-column headline list with times, no images. */
export function HomeLatestList({ items, title, allHref, allLabel }: { items: FeedArticle[]; title: string; allHref: string; allLabel: string }) {
  if (items.length < 6) return null
  return (
    <section dir="rtl" lang="ar" aria-labelledby="home-latest" className="py-6 md:py-10">
      <div className={WRAP}>
        <div className="rounded-[2rem] bg-neutral-100 px-5 py-8 md:px-10 md:py-12">
          <div className="mb-7 flex items-center justify-between md:mb-9">
            <h2 id="home-latest" className={`${H2} text-black`}>
              {title}
            </h2>
            <Link href={allHref} className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-neutral-700">
              {allLabel}
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
            {items.slice(0, 10).map((a) => (
              <li key={a.id}>
                <Link href={getArticlePath(a.id, a.title)} className="group flex items-baseline gap-4 text-right">
                  <time dateTime={a.publishedAt} className="w-20 shrink-0 text-xs font-bold text-neutral-400">
                    {formatRelativeAr(a.publishedAt)}
                  </time>
                  <span className="line-clamp-2 text-[16px] font-bold leading-snug text-neutral-900 group-hover:underline">{a.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
