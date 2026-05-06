import type { Metadata } from "next"

import { SiteFooter } from "@/components/site-footer"
import { SiteSubscribeBanner } from "@/components/site-subscribe-banner"
import { HomeHeroSection } from "@/components/home-hero"
import { HomeCampusNewsSection } from "@/components/home-campus-news"
import { HomeFinanceSpotlight } from "@/components/home-finance-spotlight"
import { HomeSportsRow } from "@/components/home-sports-row"
import { HomeTechRow } from "@/components/home-tech-row"
import { SiteNavbar } from "@/components/site-navbar"
import { ar } from "@/lib/ui-ar"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: ar.homeMetaTitle,
  description: ar.homeMetaDescription,
}

/** Home: قسم تمويل + التذييل. */
export default async function HomePage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col pt-24 md:pt-[5.75rem]">
        <HomeHeroSection />
        <HomeCampusNewsSection />
        <HomeFinanceSpotlight />
        <HomeSportsRow />
        <HomeTechRow />
      </main>
      <SiteSubscribeBanner />
      <SiteFooter />
    </>
  )
}
