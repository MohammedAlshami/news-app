import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"

import { CategoryGrid, CategoryHeader, CategoryLead } from "@/components/category-sections"
import { HomeLongReads, HomePhotoMosaic, HomeTrending } from "@/components/home-extra-sections"
import { HomeRatesSection } from "@/components/home-rates"
import { SiteAdSpots } from "@/components/site-ad-spots"
import { areSiteAdsEnabled } from "@/lib/site-ads-enabled"
import { getHomeRates } from "@/lib/db-price-rates.server"
import { getActiveSiteAdsForHome } from "@/lib/db-site-ads.server"
import {
  findCategory,
  getCategoriesCached,
  getCategoryFeedPage,
  getCategoryPool,
  isSubscribedCached,
} from "@/lib/db-site-cache.server"
import {
  SITE_LOCALE,
  SITE_NAME,
  alternatesFor,
  buildBreadcrumbJsonLd,
  jsonLdString,
} from "@/lib/seo"
import { ALL_CATEGORIES_ID, getCategoryPagePath } from "@/lib/site-routes"
import { ar } from "@/lib/ui-ar"

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ page?: string }>
}

export const dynamic = "force-dynamic"

const MAX_PAGE = 500

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10)
  return Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_PAGE) : 1
}

async function resolve(id: string) {
  const categories = await getCategoriesCached()
  if (id === ALL_CATEGORIES_ID) {
    return {
      categories,
      cat: undefined,
      title: ar.categoryAllTitle,
      description: ar.categoryAllDescription,
      slug: ALL_CATEGORIES_ID as string,
    }
  }
  const cat = findCategory(categories, id)
  if (!cat) return null
  return { categories, cat, title: cat.name, description: cat.description, slug: cat.slug }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params
  const page = parsePage((await searchParams)?.page)
  const r = await resolve(id)
  if (!r) return { title: ar.notFound, robots: { index: false } }

  const base = getCategoryPagePath(r.slug)
  const path = page > 1 ? `${base}?page=${page}` : base
  const description = r.description?.trim() || `${r.title} — ${ar.categoryAllDescription}`
  const title = page > 1 ? `${r.title} - ${page}` : r.title
  const { hasNext } = await getCategoryFeedPage(r.cat?.id, page)

  return {
    title,
    description,
    alternates: alternatesFor(path),
    openGraph: { type: "website", url: path, siteName: SITE_NAME, locale: SITE_LOCALE, title, description },
    twitter: { card: "summary_large_image", title, description },
    pagination: {
      previous: page > 1 ? (page === 2 ? base : `${base}?page=${page - 1}`) : null,
      next: hasNext ? `${base}?page=${page + 1}` : null,
    },
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const page = parsePage((await searchParams)?.page)
  const r = await resolve(id)
  if (!r) notFound()

  // Normalise `/category/<uuid>` (and any alias) to the slug URL.
  if (id !== r.slug) permanentRedirect(getCategoryPagePath(r.slug))

  const [feed, subscribed] = await Promise.all([
    getCategoryFeedPage(r.cat?.id, page),
    isSubscribedCached(),
  ])
  if (page > 1 && feed.articles.length === 0) notFound()
  const showAds = areSiteAdsEnabled() && !subscribed
  const categoryAds = showAds ? await getActiveSiteAdsForHome().catch(() => []) : []

  const categoryNameById = new Map(r.categories.map((c) => [c.id, c.name] as const))
  const categoryName = (a: { categoryIds: string[] }) => categoryNameById.get(a.categoryIds[0] ?? "")
  const basePath = getCategoryPagePath(r.slug)
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: ar.home, path: "/" },
    { name: r.title, path: basePath },
  ])

  // Section data (first page only): one pool query, sliced so no story repeats between sections.
  const first = page === 1
  const pool = first ? await getCategoryPool(r.cat?.id) : []
  const isEconomy = r.slug === "economy"
  const rates = first && isEconomy ? await getHomeRates().catch(() => null) : null
  const used = new Set<string>()
  const take = (list: typeof pool, n: number) => {
    const out = list.filter((a) => !used.has(a.id)).slice(0, n)
    out.forEach((a) => used.add(a.id))
    return out
  }
  const lead = take(pool, 3)
  const trending = take([...pool].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)), 5)
  const longReads = take([...pool].sort((a, b) => (b.bodyLength ?? 0) - (a.bodyLength ?? 0)), 4)
  const mosaic = take(pool, 5)
  const gridArticles = first ? feed.articles.filter((a) => !used.has(a.id) || pool.length === 0) : feed.articles

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <CategoryHeader
        title={r.title}
        description={r.description ?? ""}
        total={first ? pool.length : 0}
        categories={r.categories}
        activeSlug={r.slug}
        hrefFor={getCategoryPagePath}
        allHref={getCategoryPagePath(ALL_CATEGORIES_ID)}
        allLabel={ar.categoryAllTitle}
      />
      {first ? (
        <>
          <CategoryLead items={lead} isSubscribed={subscribed} />
          {rates ? <HomeRatesSection rates={rates} converterHref="/tools/currency-converter" compact /> : null}
          <HomeTrending items={trending} title="الأكثر قراءة في القسم" isSubscribed={subscribed} categoryName={categoryName} />
          {showAds && categoryAds.length > 0 ? (
            <div className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8 2xl:px-10">
              <SiteAdSpots ads={categoryAds} />
            </div>
          ) : null}
          <HomeLongReads items={longReads} title={ar.homeLongReads} subtitle={ar.homeLongReadsSub} isSubscribed={subscribed} categoryName={categoryName} />
          <HomePhotoMosaic items={mosaic} title={ar.homePhotos} isSubscribed={subscribed} />
        </>
      ) : null}
      <CategoryGrid
        title={r.cat ? `كل أخبار ${r.cat.name}` : ar.feedAllHeading}
        articles={gridArticles}
        isSubscribed={subscribed}
        pagination={{ page, hasNext: feed.hasNext, basePath }}
        emptyLabel={ar.noArticles}
      />
    </div>
  )
}
