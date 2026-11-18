import type { Metadata } from "next"

import {
  HomeCategoryFeature,
  HomeFeatured,
  HomeLatestList,
  HomeLongReads,
  HomePhotoMosaic,
  HomeSpotlightPair,
  HomeTrending,
} from "@/components/home-extra-sections"
import { HomeHeroSection } from "@/components/home-hero"
import { HomeTopicCarousel } from "@/components/home-topic-carousel"
import {
  getCategoriesCached,
  getHomeHero,
  getHomePool,
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
import { HomeUsdRates } from "@/components/home-usd-rates"
import { getHomeRates } from "@/lib/db-price-rates.server"
import { getActiveSiteAdsForHome } from "@/lib/db-site-ads.server"
import { areSiteAdsEnabled } from "@/lib/site-ads-enabled"
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

/** Categories that get their own block (matched by Arabic name) instead of a carousel. */
const FEATURE_BLOCKS = {
  سياسة: { variant: "row", tone: "plain" },
  رياضة: { variant: "split", tone: "soft" },
  صحة: { variant: "split", tone: "soft" },
} as const

export default async function HomePage() {
  const [subscribed, allCategories, heroArticles, pool] = await Promise.all([
    isSubscribedCached(),
    getCategoriesCached(),
    getHomeHero(),
    getHomePool(),
  ])
  const rates = await getHomeRates().catch(() => ({ sanaa: [], aden: [], updatedAt: null }))
  const sponsoredAds = areSiteAdsEnabled() && !subscribed ? await getActiveSiteAdsForHome().catch(() => []) : []
  const heroIds = new Set(heroArticles.map((a) => a.id))

  // Extra sections are cut from ONE pool query (no repeats between them, none from the hero).
  const used = new Set(heroIds)
  const take = (list: typeof pool, n: number) => {
    const out = list.filter((a) => !used.has(a.id)).slice(0, n)
    out.forEach((a) => used.add(a.id))
    return out
  }
  const byViews = [...pool].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
  const trending = take(byViews, 5)
  const longReads = take([...pool].sort((a, b) => (b.bodyLength ?? 0) - (a.bodyLength ?? 0)), 4)
  const featuredPicks = take(byViews, 3)
  const spotlight = take(pool, 2)
  const mosaic = take(pool, 5)
  const latest = take(pool, 10)

  // One query per category (limit 8 each). Stories already used above are not repeated when enough others remain.
  const sectionArticles = await Promise.all(allCategories.map((c) => getHomeSection(c.id)))
  const sections = allCategories
    .map((cat, i) => {
      const fresh = sectionArticles[i].filter((a) => !used.has(a.id))
      return { cat, articles: fresh.length >= 4 ? fresh : sectionArticles[i].filter((a) => !heroIds.has(a.id)) }
    })
    .filter((s) => s.articles.length >= 2)

  const categoryById = new Map(allCategories.map((c) => [c.id, c.name]))
  const categoryName = (a: { categoryIds: string[] }) => categoryById.get(a.categoryIds[0] ?? "")
  const allHref = getCategoryPagePath(ALL_CATEGORIES_ID)

  const blockFor = (name: keyof typeof FEATURE_BLOCKS) => {
    const sec = sections.find((s) => s.cat.name === name)
    if (!sec) return null
    const cfg = FEATURE_BLOCKS[name]
    return (
      <HomeCategoryFeature
        key={`feature-${sec.cat.id}`}
        id={`cat-${sec.cat.slug}`}
        title={sec.cat.name}
        href={getCategoryPagePath(sec.cat.slug)}
        moreLabel={ar.sectionMore}
        articles={sec.articles}
        variant={cfg.variant}
        tone={cfg.tone}
        isSubscribed={subscribed}
      />
    )
  }
  const carousels = sections
    .filter((s) => !(s.cat.name in FEATURE_BLOCKS))
    .map(({ cat, articles }) => (
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
    ))

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

      <HomeTrending items={trending} title={ar.homeTrending} isSubscribed={subscribed} categoryName={categoryName} />
      {carousels[0]}
      <HomeFeatured ads={sponsoredAds} picks={featuredPicks} title={ar.homeFeatured} isSubscribed={subscribed} />
      {blockFor("سياسة")}
      {carousels[1]}
      <HomeLongReads items={longReads} title={ar.homeLongReads} subtitle={ar.homeLongReadsSub} isSubscribed={subscribed} categoryName={categoryName} />
      <HomeUsdRates rates={rates} href="/tools/currency-converter" />
      <HomePhotoMosaic items={mosaic} title={ar.homePhotos} isSubscribed={subscribed} />
      {carousels[2]}
      {blockFor("رياضة")}
      <HomeSpotlightPair items={spotlight} title={ar.homeSpotlight} isSubscribed={subscribed} categoryName={categoryName} />
      {carousels[3]}
      {blockFor("صحة")}
      {carousels.slice(4)}
      <HomeLatestList items={latest} title={ar.homeLatest} allHref={allHref} allLabel={ar.homeAllNews} />
    </>
  )
}
