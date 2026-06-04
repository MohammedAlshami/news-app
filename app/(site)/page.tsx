import type { Metadata } from "next"

import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteSubscribeBanner } from "@/components/site-subscribe-banner"
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
import { getCategoryNavItems } from "@/lib/categories"
import { isSubscribed } from "@/lib/subscription"
import { ar } from "@/lib/ui-ar"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: ar.homeMetaTitle,
  description: ar.homeMetaDescription,
}

export default async function HomePage() {
  const categoryLinks = (await getCategoryNavItems())
    .filter((item) => item.id !== "all")
    .slice(0, 5)

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
      <SiteNavbar primaryLinks={categoryLinks} />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col pt-24 md:pt-[5.75rem]">
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
      </main>
      <SiteSubscribeBanner />
      <div className="px-2 pb-2 sm:px-4">
        <div className="-mt-32 overflow-hidden rounded-2xl">
          <SiteFooter />
        </div>
      </div>
    </>
  )
}
