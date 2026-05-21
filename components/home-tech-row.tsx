"use client"

import { HomeTopicCarousel } from "@/components/home-topic-carousel"
import type { FeedArticle } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"

type Props = {
  articles: FeedArticle[]
  isSubscribed: boolean
}

export function HomeTechRow({ articles, isSubscribed }: Props) {
  return (
    <HomeTopicCarousel
      headingId="home-tech-heading"
      title={ar.homeTechSectionTitle}
      articles={articles}
      isSubscribed={isSubscribed}
      navPrevLabel={ar.homeFinanceNavPrev}
      navNextLabel={ar.homeFinanceNavNext}
    />
  )
}
