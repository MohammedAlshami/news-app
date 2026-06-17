import type { Metadata } from "next"

import { HomeHeroSection } from "@/components/home-hero"
import { HomeTopicCarousel } from "@/components/home-topic-carousel"
import {
  getHeroArticles,
  getArticlesByCategory,
} from "@/lib/db-home.server"
import { getCategories } from "@/lib/db-categories.server"
import { isSubscribed } from "@/lib/subscription"
import { ar } from "@/lib/ui-ar"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: ar.homeMetaTitle,
  description: ar.homeMetaDescription,
}

export default async function HomePage() {
  const subscribed = await isSubscribed()
  const allCategories = await getCategories()

  const [heroArticles, ...allArticles] = await Promise.all([
    getHeroArticles(),
    ...allCategories.map((c) => getArticlesByCategory(c.slug, 12)),
  ])

  return (
    <>
      <HomeHeroSection
        featured={heroArticles[0] ?? null}
        side={heroArticles[1] ?? null}
        row={heroArticles[2] ?? null}
        isSubscribed={subscribed}
      />

      {allCategories.map((cat, i) => {
        const articles = allArticles[i]
        if (!articles || articles.length < 2) return null

        return (
          <HomeTopicCarousel
            key={cat.id}
            headingId={`cat-${cat.slug}`}
            title={cat.name}
            articles={articles}
            isSubscribed={subscribed}
            navPrevLabel={ar.homeFinanceNavPrev}
            navNextLabel={ar.homeFinanceNavNext}
          />
        )
      })}
    </>
  )
}
