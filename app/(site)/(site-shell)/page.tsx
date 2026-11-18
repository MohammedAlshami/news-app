import type { Metadata } from "next"

import { HomeCategoryTrio, HomeLongReads, HomePhotoMosaic, HomeTrending } from "@/components/home-extra-sections"
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
  const [subscribed, allCategories, heroArticles, pool] = await Promise.all([
    isSubscribedCached(),
    getCategoriesCached(),
    getHomeHero(),
    getHomePool(),
  ])
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
  const mosaic = take(pool, 5)

  // One query per category (limit 8 each). Stories already used above are not repeated when enough others remain.
  const sectionArticles = await Promise.all(allCategories.map((c) => getHomeSection(c.id)))
  const sections = allCategories
    .map((cat, i) => {
      const fresh = sectionArticles[i].filter((a) => !used.has(a.id))
      return { cat, articles: fresh.length >= 3 ? fresh : sectionArticles[i].filter((a) => !heroIds.has(a.id)) }
    })
    .filter((s) => s.articles.length >= 2)
    .slice(0, 8)

  const categoryById = new Map(allCategories.map((c) => [c.id, c.name]))
  const categoryName = (a: { categoryIds: string[] }) => categoryById.get(a.categoryIds[0] ?? "")

  const carousel = ({ cat, articles }: (typeof sections)[number]) => (
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
  )
  const trio = sections.slice(4, 7).map(({ cat, articles }) => ({
    id: cat.id,
    title: cat.name,
    href: getCategoryPagePath(cat.slug),
    articles,
  }))

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
      {sections[0] ? carousel(sections[0]) : null}
      <HomeLongReads
        items={longReads}
        title={ar.homeLongReads}
        subtitle={ar.homeLongReadsSub}
        isSubscribed={subscribed}
        categoryName={categoryName}
      />
      {sections[1] ? carousel(sections[1]) : null}
      <HomePhotoMosaic items={mosaic} title={ar.homePhotos} isSubscribed={subscribed} />
      {sections.slice(2, 4).map(carousel)}
      <HomeCategoryTrio columns={trio} moreLabel={ar.sectionMore} isSubscribed={subscribed} />
    </>
  )
}
