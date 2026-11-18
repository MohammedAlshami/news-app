import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"

import { ArticleHighlights } from "@/components/article-highlights"
import { ArticleImageSection } from "@/components/article-image-section"
import { ArticleBody } from "@/components/article-body"
import { NewsArticleView } from "@/components/news-article-view"
import { RecommendedArticles } from "@/components/recommended-articles"
import { SubscriptionPageGate } from "@/components/subscription-page-gate"
import { TrackArticleView } from "@/components/track-article-view"
import { SiteAdSpots } from "@/components/site-ad-spots"
import {
  newsArticleBackFromCategoryIds,
  newsArticleCategoryBylineFromIds,
} from "@/lib/news-article-display"
import { formatArticleDate } from "@/lib/format-date"
import { getActiveSiteAdsForArticle } from "@/lib/db-site-ads.server"
import { getRecommendedArticles } from "@/lib/db-public-articles.server"
import {
  findCategory,
  getArticleForPage,
  getCategoriesCached,
  isSubscribedCached,
} from "@/lib/db-site-cache.server"
import {
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
  alternatesFor,
  buildBreadcrumbJsonLd,
  buildNewsArticleJsonLd,
  jsonLdString,
} from "@/lib/seo"
import { areSiteAdsEnabled } from "@/lib/site-ads-enabled"
import { getArticlePath, getCategoryPagePath } from "@/lib/site-routes"
import { ar } from "@/lib/ui-ar"

type PageProps = {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const article = await getArticleForPage(id)
  if (!article) {
    return { title: ar.storyNotFound, robots: { index: false } }
  }
  const path = getArticlePath(article.id, article.title)
  const cover = article.coverImageUrl?.trim()
  return {
    title: article.title,
    description: article.excerpt,
    alternates: alternatesFor(path),
    openGraph: {
      type: "article",
      url: path,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      title: article.title,
      description: article.excerpt,
      publishedTime: article.createdAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      images: cover ? [{ url: absoluteUrl(cover), width: 1200, alt: article.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: cover ? [absoluteUrl(cover)] : undefined,
    },
  }
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { id } = await params

  const subscribed = await isSubscribedCached()
  const showAds = areSiteAdsEnabled() && !subscribed
  const [article, categories, articleAds, recommendedRaw] = await Promise.all([
    getArticleForPage(id),
    getCategoriesCached(),
    showAds ? getActiveSiteAdsForArticle() : Promise.resolve([]),
    getRecommendedArticles(id, 9),
  ])

  if (!article) {
    notFound()
  }

  const canonical = getArticlePath(article.id, article.title)
  if (canonical !== `/news/${id}`) permanentRedirect(canonical)

  // `id` may be a short slug, so the SQL exclusion can miss: filter again by the real id.
  const recommendedArticles = recommendedRaw.filter((a) => a.id !== article.id).slice(0, 8)

  const categoryIds = article.categoryId ? [article.categoryId] : []
  const back = newsArticleBackFromCategoryIds(categoryIds, categories)
  const categoryByline = newsArticleCategoryBylineFromIds(categoryIds, categories)
  const date = article.createdAt.toISOString().slice(0, 10)
  const category = findCategory(categories, article.categoryId ?? "")
  const cover = article.coverImageUrl?.trim()
  const jsonLd = [
    buildNewsArticleJsonLd({
      path: canonical,
      title: article.title,
      description: article.excerpt,
      images: cover ? [cover] : [],
      datePublished: article.createdAt,
      dateModified: article.updatedAt,
      memberOnly: article.isMemberOnly,
      section: category?.name,
    }),
    buildBreadcrumbJsonLd([
      { name: ar.home, path: "/" },
      ...(category ? [{ name: category.name, path: getCategoryPagePath(category.slug) }] : []),
      { name: article.title, path: canonical },
    ]),
  ]
  const jsonLdScript = (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
  )

  const adSlot =
    showAds && articleAds.length > 0 ? <SiteAdSpots ads={articleAds} /> : undefined

  function parseImageUrls(raw: string | null | undefined): string[] {
    try {
      const v = raw ? JSON.parse(raw) : []
      return Array.isArray(v) ? v.filter((u): u is string => typeof u === "string" && /^https?:\/\//.test(u)) : []
    } catch {
      return []
    }
  }

  function extractBodyImages(body: string, fallbackAlt: string): { src: string; alt: string }[] {
    try {
      const doc = JSON.parse(body)
      if (!doc.content) return []
      return doc.content
        .filter((node: any) => node.type === "image" && node.attrs?.src)
        .map((node: any) => ({
          src: node.attrs.src,
          alt: node.attrs.alt || node.attrs.title || fallbackAlt,
        }))
    } catch {
      return []
    }
  }

  const galleryImages = parseImageUrls(article.imageUrls).map((src) => ({ src, alt: article.title }))
  const bodyImages = [...galleryImages, ...extractBodyImages(article.body, article.title)].filter(
    (img, i, all) => img.src !== article.coverImageUrl && all.findIndex((o) => o.src === img.src) === i,
  )

  if (article.isMemberOnly && !subscribed) {
    return (
      <>
        {jsonLdScript}
        <TrackArticleView articleId={article.id} />
        <SubscriptionPageGate
          title={article.title}
          excerpt={article.excerpt}
          coverImageUrl={article.coverImageUrl}
          back={back}
        />
      </>
    )
  }

  const sidebarRecs = recommendedArticles.slice(0, 4)

  return (
    <>
      {jsonLdScript}
      <TrackArticleView articleId={article.id} />
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 md:px-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="mr-0 ml-auto w-full max-w-3xl">
              <ArticleImageSection
                coverImageUrl={article.coverImageUrl}
                bodyImages={bodyImages}
                categoryByline={categoryByline}
                date={date}
                title={article.title}
                excerpt={article.excerpt}
              >
                {(() => {
                  let highlights: string[] = []
                  try {
                    if (article.highlights) {
                      highlights = JSON.parse(article.highlights)
                    }
                  } catch {}
                  return highlights.length > 0 ? (
                    <ArticleHighlights items={highlights} />
                  ) : null
                })()}
                <NewsArticleView
                  adSlot={adSlot}
                >
                  <ArticleBody
                    body={article.body}
                    className="min-w-0 max-w-full [&_.simple-editor-content]:overflow-x-hidden"
                  />
                </NewsArticleView>
              </ArticleImageSection>
            </div>
          </div>
          <aside className="hidden space-y-8 lg:block lg:col-span-4">
            <div className="sticky top-28 space-y-8">
              {showAds && articleAds.length > 0 && (
                <SiteAdSpots ads={articleAds} />
              )}
              <div className="rounded-2xl p-5">
                <h3 className="mb-4 text-right text-lg font-bold text-neutral-900">{"مقالات مقترحة"}</h3>
                <div className="space-y-4">
                  {sidebarRecs.map((a) => {
                    const imgSrc = a.coverImageUrl?.trim()
                    if (!imgSrc) return null
                    return (
                      <Link
                        key={a.id}
                        href={getArticlePath(a.id)}
                        className="group flex gap-3 text-right"
                      >
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                          <Image
                            src={imgSrc}
                            alt={a.title}
                            fill
                            className="object-cover"
                            sizes="96px"
                            // Unoptimized: no Images binding yet (CDN follow-up).
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="line-clamp-2 text-sm font-bold leading-snug text-neutral-900 transition-colors group-hover:text-neutral-600">
                            {a.title}
                          </h4>
                          <time className="mt-1 block text-xs text-neutral-400">
                            {formatArticleDate(a.date)}
                          </time>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <RecommendedArticles articles={recommendedArticles} />
    </>
  )
}
