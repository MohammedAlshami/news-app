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

/** Title block: breadcrumb, big title, description and a count chip. */
export function CategoryHeader({ title, description, total }: { title: string; description: string; total: number }) {
  return (
    <header dir="rtl" lang="ar" className="bg-white">
      <div className={`${WRAP} pb-2 pt-8 md:pt-12`}>
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
          {total > 0 ? <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-600">{total.toLocaleString("ar-EG")} خبر في آخر ٦٠ يوماً</span> : null}
        </div>
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

function dayLabel(iso: string | undefined, now: number): string {
  if (!iso) return "سابقاً"
  const t = Date.parse(iso)
  const dayMs = 86_400_000
  const today = Math.floor(now / dayMs)
  const d = Math.floor(t / dayMs)
  if (d === today) return "اليوم"
  if (d === today - 1) return "أمس"
  return new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(t))
}

/**
 * The category's running news stream: grouped by day, one row per story (image, time, headline, excerpt).
 * Optional right-hand column for ads.
 */
export function CategoryStream({
  articles,
  isSubscribed,
  pagination,
  emptyLabel,
  aside,
}: {
  articles: FeedArticle[]
  isSubscribed: boolean
  pagination?: { page: number; hasNext: boolean; basePath: string }
  emptyLabel: string
  aside?: React.ReactNode
}) {
  const now = Date.now()
  const groups: { label: string; items: FeedArticle[] }[] = []
  for (const a of articles) {
    const label = dayLabel(a.publishedAt, now)
    const g = groups[groups.length - 1]
    if (g && g.label === label) g.items.push(a)
    else groups.push({ label, items: [a] })
  }
  const href = (n: number) => (n <= 1 ? pagination!.basePath : `${pagination!.basePath}?page=${n}`)
  const btn = "inline-flex items-center gap-1.5 rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800"
  return (
    <section dir="rtl" lang="ar" aria-label="آخر أخبار القسم" className="py-8 md:py-12">
      <div className={WRAP}>
        <div className={aside ? "grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12" : ""}>
          <div className={aside ? "lg:col-span-9" : ""}>
            {articles.length === 0 ? <p className="text-right text-neutral-500">{emptyLabel}</p> : null}
            {groups.map((g) => (
              <div key={g.label} className="mb-10 last:mb-0">
                <div className="mb-5 flex items-center gap-3">
                  <h2 className="rounded-full bg-black px-5 py-1.5 text-base font-extrabold text-white">{g.label}</h2>
                  <span className="text-sm font-bold text-neutral-400">{g.items.length.toLocaleString("ar-EG")} خبر</span>
                </div>
                <ul className={`grid grid-cols-1 gap-4 ${aside ? "xl:grid-cols-2" : "lg:grid-cols-2"}`}>
                  {g.items.map((a) => (
                    <li key={a.id}>
                      <SubscriptionGate
                        isMemberOnly={a.isMemberOnly}
                        isSubscribed={isSubscribed}
                        href={getArticlePath(a.id, a.title)}
                        className="group flex h-full gap-4 rounded-3xl bg-neutral-50 p-3 text-right transition-colors hover:bg-neutral-100 md:gap-5 md:p-4"
                      >
                        <Img a={a} sizes="(max-width: 768px) 40vw, 180px" className="aspect-[4/3] w-32 shrink-0 self-start rounded-2xl sm:w-44" />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <time dateTime={a.publishedAt} className="text-xs font-bold text-red-600">{formatRelativeAr(a.publishedAt)}</time>
                          <span className="mt-1.5 line-clamp-3 block text-lg font-extrabold leading-snug text-neutral-900 md:text-xl">{a.title}</span>
                          <span className="mt-2 line-clamp-2 hidden text-sm leading-relaxed text-neutral-500 sm:block">{a.excerpt}</span>
                        </span>
                      </SubscriptionGate>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
          {aside ? <aside className="lg:col-span-3"><div className="sticky top-28 space-y-6">{aside}</div></aside> : null}
        </div>
      </div>
    </section>
  )
}
