import "server-only"

import { getCategories } from "@/lib/db-categories.server"
import { getFeedArticlesByPageId } from "@/lib/db-public-articles.server"
import { ALL_CATEGORIES_ID } from "@/lib/site-routes"
import type { Article, SiteCategory } from "@/lib/site-types"

export type HomeSection = {
  id: string
  title: string
  href: string
  articles: Article[]
}

export type HomeData = {
  hero: Article | null
  sideStories: Article[]
  latestArticles: Article[]
  sections: HomeSection[]
  categories: SiteCategory[]
}

export async function getHomeData(): Promise<HomeData> {
  const categories = await getCategories()
  const allArticles = await getFeedArticlesByPageId(ALL_CATEGORIES_ID)
  const hero = allArticles[0] ?? null
  const sideStories = allArticles.slice(1, 4)
  const latestArticles = allArticles.slice(0, 6)

  const sections = await Promise.all(
    categories.slice(0, 3).map(async (category) => ({
      id: category.id,
      title: category.name,
      href: `/category/${category.id}`,
      articles: await getFeedArticlesByPageId(category.id),
    })),
  )

  return {
    hero,
    sideStories,
    latestArticles,
    sections,
    categories,
  }
}
