import type { Metadata } from "next"

import { SiteFooter } from "@/components/site-footer"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteSubscribeBanner } from "@/components/site-subscribe-banner"
import { HomeCampusNewsSection } from "@/components/home-campus-news"
import { HomeFinanceSpotlight } from "@/components/home-finance-spotlight"
import { HomeHeroSection } from "@/components/home-hero"
import { HomeSportsRow } from "@/components/home-sports-row"
import { HomeTechRow } from "@/components/home-tech-row"
import { getCategoryNavItems } from "@/lib/categories"
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

  return (
    <>
      <SiteNavbar primaryLinks={categoryLinks} />
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

