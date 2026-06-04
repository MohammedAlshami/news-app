import type { Metadata } from "next"

import { HomeCampusNewsSection } from "@/components/home-campus-news"
import { HomeFinanceSpotlight } from "@/components/home-finance-spotlight"
import { HomeHeroSection } from "@/components/home-hero"
import { HomeSportsRow } from "@/components/home-sports-row"
import { HomeTechRow } from "@/components/home-tech-row"
import {
  getCampusNewsArticles,
  getFinanceArticles,
  getHeroArticles,
  getSportsArticles,
  getTechArticles,
} from "@/lib/db-home.server"
import { isSubscribed } from "@/lib/subscription"
import { ar } from "@/lib/ui-ar"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: ar.homeMetaTitle,
  description: ar.homeMetaDescription,
}

export default async function HomePage() {
  const subscribed = await isSubscribed()

  const [heroArticles, campusArticles, financeArticles, sportsArticles, techArticles] =
    await Promise.all([
      getHeroArticles(),
      getCampusNewsArticles(),
      getFinanceArticles(),
      getSportsArticles(),
      getTechArticles(),
    ])

  return (
    <>
      <HomeHeroSection
          featured={heroArticles[0] ?? null}
          side={heroArticles[1] ?? null}
          row={heroArticles[2] ?? null}
          isSubscribed={subscribed}
        />
        <HomeCampusNewsSection articles={campusArticles} isSubscribed={subscribed} />
        <HomeFinanceSpotlight articles={financeArticles} isSubscribed={subscribed} />
        <HomeSportsRow articles={sportsArticles} isSubscribed={subscribed} />
        <HomeTechRow articles={techArticles} isSubscribed={subscribed} />
    </>
  )
}
