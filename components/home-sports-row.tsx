"use client"

import { HomeTopicCarousel } from "@/components/home-topic-carousel"
import type { FeedArticle } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"

type Props = {
  articles: FeedArticle[]
  isSubscribed: boolean
}

export function HomeSportsRow({ articles, isSubscribed }: Props) {
  return (
    <HomeTopicCarousel
      headingId="home-sports-heading"
      title={ar.homeSportsSectionTitle}
      articles={articles}
      isSubscribed={isSubscribed}
      navPrevLabel={ar.homeFinanceNavPrev}
      navNextLabel={ar.homeFinanceNavNext}
    />
  )
}
