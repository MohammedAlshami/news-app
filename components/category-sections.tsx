import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { SubscriptionGate } from "@/components/subscription-gate"
import { formatRelativeAr } from "@/lib/format-date"
import { getArticlePath } from "@/lib/site-routes"
import type { FeedArticle, SiteCategory } from "@/lib/site-types"

const WRAP = "mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8 xl:px-8 2xl:px-10"

function Img({ a, sizes, className = "", priority = false }: { a: FeedArticle; sizes: string; className?: string; priority?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-neutral-200 ${className}`}>
      {a.coverImageUrl ? (
        <Image
          src={a.coverImageUrl}
          alt={a.title}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          // Unoptimized: no Images binding; legacy covers hot-link source CDNs that 403 the server-side optimizer.
          unoptimized
        />
      ) : null}
    </div>
  )
}

/** Title block with the category pills (active one is filled black; no borders). */
export function CategoryHeader({
  title,
  description,
  total,
  categories,
  activeSlug,
  hrefFor,
  allHref,
  allLabel,
}: {
  title: string
  description: string
  total: number
  categories: SiteCategory[]
  activeSlug: string
  hrefFor: (slug: string) => string
  allHref: string
  allLabel: string
}) {
  const pill = (active: boolean) =>
    `inline-block whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold transition-colors ${active ? "bg-black text-white" : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"}`
  return (
    <header dir="rtl" lang="ar" className="bg-white">
      <div className={`${WRAP} pb-4 pt-8 md:pt-12`}>
        <nav className="mb-5 flex items-center gap-2 text-sm text-neutral-500" aria-label="مسار التنقل">
          <Link href="/" className="hover:text-neutral-900">الرئيسية</Link>
          <ChevronLeft className="h-3.5 w-3.5 text-neutral-300" aria-hidden />
          <span className="font-medium text-neutral-900">{title}</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl text-right">
            <h1 className="text-4xl font-extrabold tracking-tight text-black md:text-6xl">{title}</h1>
            {description.trim() ? <p className="mt-3 text-base leading-relaxed text-neutral-600 md:text-lg">{description}</p> : null}
          </div>
          {total > 0 ? <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-600">{total.toLocaleString("ar-EG")} خبر حديث</span> : null}
        </div>
        <nav aria-label="الأقسام" className="mt-7 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href={allHref} className={pill(activeSlug === "all")}>{allLabel}</Link>
          {categories.map((c) => (
            <Link key={c.id} href={hrefFor(c.slug)} className={pill(c.slug === activeSlug)}>
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

/** Lead story over the image + two stacked stories. */
export function CategoryLead({ items, isSubscribed }: { items: FeedArticle[]; isSubscribed: boolean }) {
  if (items.length === 0) return null
  const [lead, ...side] = items
  return (
    <section dir="rtl" lang="ar" className="py-6 md:py-8">
      <div className={WRAP}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          <article className="lg:col-span-8">
            <SubscriptionGate isMemberOnly={lead.isMemberOnly} isSubscribed={isSubscribed} href={getArticlePath(lead.id, lead.title)} className="group relative block overflow-hidden rounded-3xl">
              <Img a={lead} sizes="(max-width: 1024px) 100vw, 66vw" priority className="aspect-[4/3] md:aspect-[16/9]" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden />
              <span className="absolute inset-x-0 bottom-0 block space-y-3 p-5 text-right text-white md:p-9">
                <span className="line-clamp-3 block text-2xl font-extrabold leading-snug md:text-4xl">{lead.title}</span>
                <span className="line-clamp-2 hidden max-w-3xl text-[15px] leading-relaxed text-white/80 md:block">{lead.excerpt}</span>
                <span className="block text-xs text-white/70">{formatRelativeAr(lead.publishedAt)}</span>
              </span>
            </SubscriptionGate>
          </article>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:gap-6">
            {side.slice(0, 2).map((a) => (
              <article key={a.id}>
                <SubscriptionGate isMemberOnly={a.isMemberOnly} isSubscribed={isSubscribed} href={getArticlePath(a.id, a.title)} className="group relative block overflow-hidden rounded-3xl">
                  <Img a={a} sizes="(max-width: 1024px) 100vw, 33vw" className="aspect-[16/10]" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden />
                  <span className="absolute inset-x-0 bottom-0 line-clamp-3 block p-4 text-right text-lg font-extrabold leading-snug text-white md:p-5">{a.title}</span>
                </SubscriptionGate>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Paginated grid of every article in the category. */
export function CategoryGrid({
  title,
  articles,
  isSubscribed,
  pagination,
  emptyLabel,
}: {
  title: string
  articles: FeedArticle[]
  isSubscribed: boolean
  pagination?: { page: number; hasNext: boolean; basePath: string }
  emptyLabel: string
}) {
  const href = (n: number) => (n <= 1 ? pagination!.basePath : `${pagination!.basePath}?page=${n}`)
  const btn = "inline-flex items-center gap-1.5 rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800"
  return (
    <section dir="rtl" lang="ar" aria-labelledby="cat-all" className="py-10 md:py-14">
      <div className={WRAP}>
        <h2 id="cat-all" className="mb-8 text-right text-2xl font-bold tracking-tight text-black md:text-3xl">{title}</h2>
        {articles.length === 0 ? (
          <p className="text-right text-neutral-500">{emptyLabel}</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((a) => (
              <article key={a.id} className="text-right">
                <SubscriptionGate isMemberOnly={a.isMemberOnly} isSubscribed={isSubscribed} href={getArticlePath(a.id, a.title)} className="group block">
                  <Img a={a} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 24vw" className="aspect-[16/10] rounded-2xl" />
                  <span className="mt-4 line-clamp-3 block text-lg font-extrabold leading-snug text-neutral-900 group-hover:underline">{a.title}</span>
                  <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-neutral-500">{a.excerpt}</span>
                  <span className="mt-2 block text-xs text-neutral-400">{formatRelativeAr(a.publishedAt)}</span>
                </SubscriptionGate>
              </article>
            ))}
          </div>
        )}
        {pagination && (pagination.page > 1 || pagination.hasNext) ? (
          <nav aria-label="التنقل بين الصفحات" className="mt-12 flex items-center justify-center gap-4">
            {pagination.page > 1 ? (
              <Link href={href(pagination.page - 1)} rel="prev" className={btn}>
                <ChevronRight className="h-4 w-4" aria-hidden />
                السابقة
              </Link>
            ) : null}
            <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-700">{pagination.page.toLocaleString("ar-EG")}</span>
            {pagination.hasNext ? (
              <Link href={href(pagination.page + 1)} rel="next" className={btn}>
                التالية
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </section>
  )
}
