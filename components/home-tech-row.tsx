"use client"

import { HomeTopicCarousel } from "@/components/home-topic-carousel"
import { ar } from "@/lib/ui-ar"

const TECH_CARD_SOURCES = [
  {
    titleKey: "homeTechCard1Title" as const,
    excerptKey: "homeTechCard1Excerpt" as const,
    src: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    titleKey: "homeTechCard2Title" as const,
    excerptKey: "homeTechCard2Excerpt" as const,
    src: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    titleKey: "homeTechCard3Title" as const,
    excerptKey: "homeTechCard3Excerpt" as const,
    src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    titleKey: "homeTechCard4Title" as const,
    excerptKey: "homeTechCard4Excerpt" as const,
    src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    titleKey: "homeTechCard5Title" as const,
    excerptKey: "homeTechCard5Excerpt" as const,
    src: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
] as const

export function HomeTechRow() {
  const cards = TECH_CARD_SOURCES.map((c) => ({
    title: ar[c.titleKey],
    excerpt: ar[c.excerptKey],
    src: c.src,
  }))

  return (
    <HomeTopicCarousel
      headingId="home-tech-heading"
      title={ar.homeTechSectionTitle}
      cards={cards}
      navPrevLabel={ar.homeFinanceNavPrev}
      navNextLabel={ar.homeFinanceNavNext}
    />
  )
}
