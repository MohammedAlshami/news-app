import type { Metadata } from "next"

import { HomeHeroSection } from "@/components/home-hero"
import { HomeTopicCarousel } from "@/components/home-topic-carousel"
import {
  HOME_MAX_SECTIONS,
  getCategoriesCached,
  getHomeHero,
  getHomeSection,
  isSubscribedCached,
} from "@/lib/db-site-cache.server"
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_LOCALE,
  SITE_NAME,
  alternatesFor,
  buildWebsiteJsonLd,
  jsonLdString,
} from "@/lib/seo"
import { getCategoryPagePath } from "@/lib/site-routes"
import { ar } from "@/lib/ui-ar"

// Reads the session cookie (paywall badges) so the page is per-user: it must not get a public s-maxage.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: alternatesFor("/"),
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: HOME_TITLE, description: HOME_DESCRIPTION },
}

export default async function HomePage() {
  const [subscribed, allCategories, heroArticles] = await Promise.all([
    isSubscribedCached(),
    getCategoriesCached(),
    getHomeHero(),
  ])
  // One query per category (limit 8 each); only the first HOME_MAX_SECTIONS non-trivial ones render.
  const sectionArticles = await Promise.all(allCategories.map((c) => getHomeSection(c.id)))
  const sections = allCategories
    .map((cat, i) => ({ cat, articles: sectionArticles[i] }))
    .filter((s) => s.articles.length >= 2)
    .slice(0, HOME_MAX_SECTIONS)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(buildWebsiteJsonLd()) }}
      />
      <h1 className="sr-only">{SITE_NAME}</h1>
      <HomeHeroSection
        featured={heroArticles[0] ?? null}
        side={heroArticles[1] ?? null}
        row={heroArticles[2] ?? null}
        isSubscribed={subscribed}
      />

      {sections.map(({ cat, articles }) => (
        <HomeTopicCarousel
          key={cat.id}
          headingId={`cat-${cat.slug}`}
          title={cat.name}
          articles={articles}
          categoryHref={getCategoryPagePath(cat.slug)}
          moreLabel={ar.sectionMore}
          isSubscribed={subscribed}
          navPrevLabel={ar.homeFinanceNavPrev}
          navNextLabel={ar.homeFinanceNavNext}
        />
      ))}
    </>
  )
}
