import type { Metadata } from "next"

import { HomeLandingView } from "@/components/home-landing-view"
import { getActiveSiteAdsForHome } from "@/lib/db-site-ads.server"
import { getHomeData } from "@/lib/db-home.server"
import { ar } from "@/lib/ui-ar"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: ar.homeMetaTitle,
  description: ar.homeMetaDescription,
}

export default async function HomePage() {
  const [ads, home] = await Promise.all([
    getActiveSiteAdsForHome(),
    getHomeData(),
  ])
  return <HomeLandingView ads={ads} {...home} />
}
