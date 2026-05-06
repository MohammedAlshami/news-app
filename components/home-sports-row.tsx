"use client"

import { HomeTopicCarousel } from "@/components/home-topic-carousel"
import { ar } from "@/lib/ui-ar"

const SPORTS_CARD_SOURCES = [
  {
    titleKey: "homeSportsCard1Title" as const,
    excerptKey: "homeSportsCard1Excerpt" as const,
    src: "https://plus.unsplash.com/premium_photo-1684820878202-52781d8e0ea9?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    titleKey: "homeSportsCard2Title" as const,
    excerptKey: "homeSportsCard2Excerpt" as const,
    src: "https://images.unsplash.com/photo-1565992441121-4367c2967103?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    titleKey: "homeSportsCard3Title" as const,
    excerptKey: "homeSportsCard3Excerpt" as const,
    src: "https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    titleKey: "homeSportsCard4Title" as const,
    excerptKey: "homeSportsCard4Excerpt" as const,
    src: "https://images.unsplash.com/photo-1607627000458-210e8d2bdb1d?q=80&w=1149&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    titleKey: "homeSportsCard5Title" as const,
    excerptKey: "homeSportsCard5Excerpt" as const,
    src: "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?q=80&w=1168&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
] as const

export function HomeSportsRow() {
  const cards = SPORTS_CARD_SOURCES.map((c) => ({
    title: ar[c.titleKey],
    excerpt: ar[c.excerptKey],
    src: c.src,
  }))

  return (
    <HomeTopicCarousel
      headingId="home-sports-heading"
      title={ar.homeSportsSectionTitle}
      cards={cards}
      navPrevLabel={ar.homeFinanceNavPrev}
      navNextLabel={ar.homeFinanceNavNext}
    />
  )
}
