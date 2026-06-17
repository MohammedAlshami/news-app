import type { Metadata } from "next"

import { HomeHeroSection } from "@/components/home-hero"
import { HomeFinanceSpotlight } from "@/components/home-finance-spotlight"
import { HomeSportsRow } from "@/components/home-sports-row"
import { HomeTechRow } from "@/components/home-tech-row"
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

/** Sections that use special carousel/row layouts (same order as before) */
const SPECIAL_SLUGS = ["economy", "sports", "technology"]

export default async function HomePage() {
  const subscribed = await isSubscribed()
  const allCategories = await getCategories()

  const [heroArticles, ...specialArticles] = await Promise.all([
    getHeroArticles(),
    ...SPECIAL_SLUGS.map((s) => getArticlesByCategory(s, 5)),
  ])

  const remaining = allCategories.filter(
    (c) => !SPECIAL_SLUGS.includes(c.slug),
  )

  const remainingArticles = await Promise.all(
    remaining.map((c) => getArticlesByCategory(c.slug, 5)),
  )

  return (
    <>
      <HomeHeroSection
        featured={heroArticles[0] ?? null}
        side={heroArticles[1] ?? null}
        row={heroArticles[2] ?? null}
        isSubscribed={subscribed}
      />

      {SPECIAL_SLUGS.map((slug, i) => {
        const articles = specialArticles[i]
        if (!articles || articles.length === 0) return null

        const cat = allCategories.find((c) => c.slug === slug)
        const title = cat?.name ?? slug

        if (slug === "economy") {
          return (
            <HomeFinanceSpotlight key={slug} articles={articles} isSubscribed={subscribed} />
          )
        }
        if (slug === "sports") {
          return <HomeSportsRow key={slug} articles={articles} isSubscribed={subscribed} />
        }
        if (slug === "technology") {
          return <HomeTechRow key={slug} articles={articles} isSubscribed={subscribed} />
        }
        return null
      })}

      {remaining.map((cat, i) => {
        const articles = remainingArticles[i]
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
