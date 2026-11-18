import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"

import { CategoryHeader, CategoryLead, CategoryStream } from "@/components/category-sections"
import { SiteAdSpots } from "@/components/site-ad-spots"
import { areSiteAdsEnabled } from "@/lib/site-ads-enabled"
import { getActiveSiteAdsForHome } from "@/lib/db-site-ads.server"
import {
  findCategory,
  getCategoriesCached,
  getCategoryFeedPage,
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

/** Route params arrive percent-encoded (Arabic slugs). */
function decodeParam(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
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
  const id = decodeParam((await params).id)
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
  const id = decodeParam((await params).id)
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

  const basePath = getCategoryPagePath(r.slug)
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: ar.home, path: "/" },
    { name: r.title, path: basePath },
  ])

  // First page: the 3 newest stories get the big lead treatment; the stream below continues from the 4th.
  const first = page === 1
  const lead = first ? feed.articles.slice(0, 3) : []
  const stream = first ? feed.articles.slice(3) : feed.articles

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <CategoryHeader title={r.title} description={r.description ?? ""} total={0} />
      <CategoryLead items={lead} isSubscribed={subscribed} />
      <CategoryStream
        articles={stream}
        isSubscribed={subscribed}
        pagination={{ page, hasNext: feed.hasNext, basePath }}
        emptyLabel={ar.noArticles}
        aside={showAds && categoryAds.length > 0 ? <SiteAdSpots ads={categoryAds} /> : undefined}
      />
    </div>
  )
}
