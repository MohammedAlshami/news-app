import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { SubscriptionGate } from "@/components/subscription-gate"
import { formatRelativeAr } from "@/lib/format-date"
import { getArticlePath } from "@/lib/site-routes"
import type { FeedArticle } from "@/lib/site-types"
import { cn } from "@/lib/utils"

type Common = { isSubscribed: boolean; categoryName?: (a: FeedArticle) => string | undefined }

/** Section title with the same underline accent used across the landing page. */
export function SectionHeading({ id, children, href, more }: { id?: string; children: React.ReactNode; href?: string; more?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-black pb-3">
      <h2 id={id} className="text-2xl font-extrabold tracking-tight text-black md:text-3xl">
        {children}
      </h2>
      {href && more ? (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-black underline-offset-4 hover:underline">
          {more}
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  )
}

function Cover({ article, sizes, priority = false, className }: { article: FeedArticle; sizes: string; priority?: boolean; className?: string }) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-neutral-100", className)}>
      {article.coverImageUrl ? (
        <Image
          src={article.coverImageUrl}
          alt={article.title}
          fill
          sizes={sizes}
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          // Unoptimized: no Images binding; legacy covers hot-link source CDNs that 403 the server-side optimizer.
          unoptimized
        />
      ) : null}
    </div>
  )
}

function CategoryPill({ label, dark = false }: { label?: string; dark?: boolean }) {
  if (!label) return null
  return (
    <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-bold", dark ? "bg-white text-black" : "bg-black text-white")}>
      {label}
    </span>
  )
}

/** Big image card with the headline over a dark gradient (lead story / spotlight). */
export function OverlayCard({
  article,
  isSubscribed,
  categoryName,
  sizes,
  priority = false,
  large = false,
  className,
}: Common & { article: FeedArticle; sizes: string; priority?: boolean; large?: boolean; className?: string }) {
  return (
    <article className={className}>
      <SubscriptionGate
        isMemberOnly={article.isMemberOnly}
        isSubscribed={isSubscribed}
        href={getArticlePath(article.id, article.title)}
        className="group relative block overflow-hidden rounded-3xl"
      >
        <Cover article={article} sizes={sizes} priority={priority} className={large ? "aspect-[4/3] md:aspect-[16/10]" : "aspect-[4/3]"} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 text-right md:p-8">
          <CategoryPill label={categoryName?.(article)} dark />
          <h2 className={cn("text-balance font-extrabold leading-[1.2] text-white", large ? "text-2xl md:text-4xl" : "text-xl md:text-2xl")}>
            {article.title}
          </h2>
          {large ? <p className="line-clamp-2 hidden max-w-3xl text-[15px] leading-relaxed text-white/80 md:block">{article.excerpt}</p> : null}
          <time dateTime={article.publishedAt} className="block text-xs font-medium text-white/70">
            {formatRelativeAr(article.publishedAt)}
          </time>
        </div>
      </SubscriptionGate>
    </article>
  )
}

/** Image on top, headline and meta below. */
export function StoryCard({ article, isSubscribed, categoryName, sizes }: Common & { article: FeedArticle; sizes: string }) {
  const label = categoryName?.(article)
  return (
    <article className="flex flex-col gap-3">
      <SubscriptionGate
        isMemberOnly={article.isMemberOnly}
        isSubscribed={isSubscribed}
        href={getArticlePath(article.id, article.title)}
        className="group block"
      >
        <Cover article={article} sizes={sizes} className="aspect-[16/10] rounded-2xl" />
      </SubscriptionGate>
      <div className="space-y-1.5 px-0.5 text-right">
        {label ? <span className="text-xs font-bold text-neutral-500">{label}</span> : null}
        <h3 className="text-pretty text-lg font-extrabold leading-snug text-neutral-900">
          <Link href={getArticlePath(article.id, article.title)} className="decoration-2 underline-offset-4 hover:underline">
            {article.title}
          </Link>
        </h3>
        <time dateTime={article.publishedAt} className="block text-xs font-medium text-neutral-400">
          {formatRelativeAr(article.publishedAt)}
        </time>
      </div>
    </article>
  )
}

/** Compact "latest" list: relative time + headline. */
function LatestList({ items, allHref, allLabel }: { items: FeedArticle[]; allHref: string; allLabel: string }) {
  return (
    <aside aria-label="الأحدث" className="rounded-3xl border border-neutral-200 p-5 md:p-6">
      <div className="mb-2 flex items-center justify-between border-b-2 border-black pb-3">
        <h2 className="text-xl font-extrabold text-black">الأحدث</h2>
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
        </span>
      </div>
      <ol className="divide-y divide-neutral-100">
        {items.map((a) => (
          <li key={a.id} className="py-3.5 text-right">
            <time dateTime={a.publishedAt} className="mb-1 block text-xs font-bold text-red-600">
              {formatRelativeAr(a.publishedAt)}
            </time>
            <Link href={getArticlePath(a.id, a.title)} className="text-[15px] font-bold leading-snug text-neutral-900 hover:underline">
              {a.title}
            </Link>
          </li>
        ))}
      </ol>
      <Link
        href={allHref}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-black py-2.5 text-sm font-bold text-white transition-colors hover:bg-neutral-800"
      >
        {allLabel}
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </aside>
  )
}

type HeroProps = Common & {
  lead: FeedArticle | null
  secondary: FeedArticle[]
  latest: FeedArticle[]
  allHref: string
  allLabel: string
}

export function HomeHeroSection({ lead, secondary, latest, allHref, allLabel, isSubscribed, categoryName }: HeroProps) {
  return (
    <section dir="rtl" lang="ar" className="bg-white">
      <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6 md:px-12 md:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-8 lg:col-span-8">
            {lead ? (
              <OverlayCard
                large
                priority
                article={lead}
                isSubscribed={isSubscribed}
                categoryName={categoryName}
                sizes="(max-width: 1024px) 100vw, 62vw"
              />
            ) : null}
            {secondary.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
                {secondary.map((a) => (
                  <StoryCard key={a.id} article={a} isSubscribed={isSubscribed} categoryName={categoryName} sizes="(max-width: 640px) 100vw, 30vw" />
                ))}
              </div>
            ) : null}
          </div>
          <div className="lg:col-span-4">{latest.length > 0 ? <LatestList items={latest} allHref={allHref} allLabel={allLabel} /> : null}</div>
        </div>
      </div>
    </section>
  )
}
