import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"

import { CategoryPageView } from "@/components/category-page-view"
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
  const categoryAds = !subscribed ? await getActiveSiteAdsForHome() : []

  const categoryNameById = Object.fromEntries(r.categories.map((c) => [c.id, c.name] as const))
  const basePath = getCategoryPagePath(r.slug)
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: ar.home, path: "/" },
    { name: r.title, path: basePath },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }}
      />
      <CategoryPageView
        activeId={id}
        heroTitle={r.title}
        kicker={r.cat ? r.cat.name : ar.categoryKicker}
        description={r.description}
        feedHeading={r.cat ? r.cat.name : ar.feedAllHeading}
        feedSubheading={r.cat ? r.cat.description : ar.feedAllSub}
        articles={feed.articles}
        categoryNameById={categoryNameById}
        isSubscribed={subscribed}
        ads={categoryAds}
        pagination={{ page, hasNext: feed.hasNext, basePath }}
      />
    </>
  )
}
