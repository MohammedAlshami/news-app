import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CategoryPageView } from "@/components/category-page-view"
import {
  ALL_CATEGORIES_ID,
  getCategoryById,
  getCategories,
  isValidCategoryPageId,
} from "@/lib/categories"
import { getFeedArticlesByPageId } from "@/lib/articles"
import { ar } from "@/lib/ui-ar"

function pageTitle(segment: string) {
  return `${segment} | ${ar.newsBrand}`
}

type PageProps = {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  const categories = await getCategories()
  return [
    { id: ALL_CATEGORIES_ID },
    ...categories.map((c) => ({ id: c.id })),
  ]
}

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
  const c = await getCategoryById(id)
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

  const [articles, categories] = await Promise.all([
    getFeedArticlesByPageId(id),
    getCategories(),
  ])

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
      />
    )
  }

  const cat = await getCategoryById(id)
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
    />
  )
}
