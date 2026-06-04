import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CategoryPageView } from "@/components/category-page-view"
import {
  ALL_CATEGORIES_ID,
  getCategoryByPageId,
  getCategories,
  isValidCategoryPageId,
} from "@/lib/categories"
import { getFeedArticlesByPageId } from "@/lib/articles"
import { getActiveSiteAdsForHome } from "@/lib/db-site-ads.server"
import { isSubscribed } from "@/lib/subscription"
import { ar } from "@/lib/ui-ar"

function pageTitle(segment: string) {
  return `${segment} | ${ar.newsBrand}`
}

type PageProps = {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  if (!(await isValidCategoryPageId(id))) {
    return { title: ar.notFound }
  }
  if (id === ALL_CATEGORIES_ID) {
    return {
      title: pageTitle(ar.categoryAllTitle),
      description: ar.categoryAllDescription,
    }
  }
  const c = await getCategoryByPageId(id)
  return {
    title: pageTitle(c?.name ?? ar.newsBrand),
    description: c?.description,
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { id } = await params
  if (!(await isValidCategoryPageId(id))) {
    notFound()
  }

  const [articles, categories, subscribed] = await Promise.all([
    getFeedArticlesByPageId(id),
    getCategories(),
    isSubscribed(),
  ])
  const categoryAds = !subscribed ? await getActiveSiteAdsForHome() : []

  const categoryNameById = Object.fromEntries(
    categories.map((c) => [c.id, c.name] as const),
  )

  if (id === ALL_CATEGORIES_ID) {
    return (
      <CategoryPageView
        activeId={id}
        heroTitle={ar.categoryAllTitle}
        kicker={ar.categoryKicker}
        description={ar.categoryAllDescription}
        feedHeading={ar.feedAllHeading}
        feedSubheading={ar.feedAllSub}
        articles={articles}
        categoryNameById={categoryNameById}
        isSubscribed={subscribed}
        ads={categoryAds}
      />
    )
  }

  const cat = await getCategoryByPageId(id)
  if (!cat) {
    notFound()
  }

  return (
    <CategoryPageView
      activeId={id}
      kicker={cat.name}
      heroTitle={cat.name}
      description={cat.description}
      feedHeading={cat.name}
      feedSubheading={cat.description}
      articles={articles}
      categoryNameById={categoryNameById}
      isSubscribed={subscribed}
      ads={categoryAds}
    />
  )
}
