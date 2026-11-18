import type { Metadata } from "next"

import { HomeHeroSection } from "@/components/home-hero"
import { HomeBreakingBar, HomeCategoryChips, HomeCategorySpotlight, HomeTrending } from "@/components/home-sections"
import { HomeTopicCarousel } from "@/components/home-topic-carousel"
import {
  HOME_MAX_SECTIONS,
  getCategoriesCached,
  getHomeHero,
  getHomeSection,
  getHomeTrending,
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
import { ALL_CATEGORIES_ID, getCategoryPagePath } from "@/lib/site-routes"
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

const SPOTLIGHT_SECTIONS = 2

export default async function HomePage() {
  const [subscribed, allCategories, heroArticles, trending] = await Promise.all([
    isSubscribedCached(),
    getCategoriesCached(),
    getHomeHero(9),
    getHomeTrending(7, 6),
  ])
  // One query per category (limit 8 each); stories already shown in the hero are not repeated below it.
  const heroIds = new Set(heroArticles.map((a) => a.id))
  const sectionArticles = await Promise.all(allCategories.map((c) => getHomeSection(c.id)))
  const sections = allCategories
    .map((cat, i) => ({ cat, articles: sectionArticles[i].filter((a) => !heroIds.has(a.id)) }))
    .filter((s) => s.articles.length >= 3)
    .slice(0, HOME_MAX_SECTIONS)

  const categoryById = new Map(allCategories.map((c) => [c.id, c.name]))
  const categoryName = (a: { categoryIds: string[] }) => categoryById.get(a.categoryIds[0] ?? "")
  const allHref = getCategoryPagePath(ALL_CATEGORIES_ID)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(buildWebsiteJsonLd()) }}
      />
      <h1 className="sr-only">{SITE_NAME}</h1>
      <HomeBreakingBar items={heroArticles.slice(0, 5)} allHref={allHref} />
      <HomeHeroSection
        lead={heroArticles[0] ?? null}
        secondary={heroArticles.slice(1, 3)}
        latest={heroArticles.slice(3, 9)}
        allHref={allHref}
        allLabel={ar.homeAllNews}
        isSubscribed={subscribed}
        categoryName={categoryName}
      />
      <HomeCategoryChips categories={allCategories} hrefFor={getCategoryPagePath} label={ar.homeBrowseSections} />
      <HomeTrending items={trending} title={ar.homeMostRead} isSubscribed={subscribed} categoryName={categoryName} />

      {sections.map(({ cat, articles }, i) =>
        i < SPOTLIGHT_SECTIONS ? (
          <HomeCategorySpotlight
            key={cat.id}
            headingId={`cat-${cat.slug}`}
            title={cat.name}
            articles={articles}
            href={getCategoryPagePath(cat.slug)}
            moreLabel={ar.sectionMore}
            isSubscribed={subscribed}
          />
        ) : (
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
        ),
      )}
    </>
  )
}
