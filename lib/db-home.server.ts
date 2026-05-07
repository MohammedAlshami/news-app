import "server-only"

import { getCategories } from "@/lib/db-categories.server"
import { getFeedArticlesByPageId } from "@/lib/db-public-articles.server"
import { ALL_CATEGORIES_ID } from "@/lib/site-routes"
import type { Article, FeedArticle, SiteCategory } from "@/lib/site-types"

/** Rows needed for hero, side rail, and “latest” on the home page only. */
const HOME_TOP_FEED_LIMIT = 24
/** Enough for section grids + featured-side fallback without scanning whole tables. */
const HOME_SECTION_FEED_LIMIT = 32

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

export async function getMarqueeArticles(limit: number): Promise<FeedArticle[]> {
  return getFeedArticlesByPageId(ALL_CATEGORIES_ID, { limit })
}

export async function getHomeData(): Promise<HomeData> {
  const categories = await getCategories()
  const allArticles = await getFeedArticlesByPageId(ALL_CATEGORIES_ID, {
    limit: HOME_TOP_FEED_LIMIT,
  })
  const hero = allArticles[0] ?? null
  const sideStories = allArticles.slice(1, 4)
  const latestArticles = allArticles.slice(0, 6)

  const sections = await Promise.all(
    categories.slice(0, 3).map(async (category) => ({
      id: category.id,
      title: category.name,
      href: `/category/${category.slug}`,
      articles: await getFeedArticlesByPageId(category.id, {
        limit: HOME_SECTION_FEED_LIMIT,
      }),
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
