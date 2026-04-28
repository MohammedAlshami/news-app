import type { Metadata } from "next"

import { HomeLandingView } from "@/components/home-landing-view"
import { getActiveSiteAdsForHome } from "@/lib/db-site-ads.server"
import { ar } from "@/lib/ui-ar"

export const metadata: Metadata = {
  title: ar.homeMetaTitle,
  description: ar.homeMetaDescription,
}

export default async function HomePage() {
  const ads = await getActiveSiteAdsForHome()
  return <HomeLandingView ads={ads} />
}
