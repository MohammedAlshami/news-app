import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { ArticleHighlights } from "@/components/article-highlights"
import { ArticleImageSection } from "@/components/article-image-section"
import { ArticleTiptapReadOnly } from "@/components/article-tiptap-read-only"
import { NewsArticleView } from "@/components/news-article-view"
import { RecommendedArticles } from "@/components/recommended-articles"
import { SubscriptionPageGate } from "@/components/subscription-page-gate"
import { TrackArticleView } from "@/components/track-article-view"
import { SiteAdSpots } from "@/components/site-ad-spots"
import {
  newsArticleBackFromCategoryIds,
  newsArticleCategoryBylineFromIds,
} from "@/lib/news-article-display"
import { getCategories } from "@/lib/categories"
import { formatArticleDate } from "@/lib/format-date"
import { getActiveSiteAdsForArticle } from "@/lib/db-site-ads.server"
import { getPublishedArticleRowById, getPublishedArticleRowBySlugId } from "@/lib/articles"
import { getRecommendedArticles } from "@/lib/db-public-articles.server"
import { areSiteAdsEnabled } from "@/lib/site-ads-enabled"
import { getArticlePath } from "@/lib/site-routes"
import { isSubscribed } from "@/lib/subscription"
import { ar } from "@/lib/ui-ar"

function pageTitle(segment: string) {
  return `${segment} | ${ar.newsBrand}`
}

type PageProps = {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const article = await (isFullUuid(id)
    ? getPublishedArticleRowById(id)
    : getPublishedArticleRowBySlugId(id))
  if (!article) {
    return { title: ar.storyNotFound }
  }
  return {
    title: pageTitle(article.title),
    description: article.excerpt,
    openGraph: { title: article.title, description: article.excerpt },
  }
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { id } = await params

  const subscribed = await isSubscribed()
  const showAds = areSiteAdsEnabled() && !subscribed
  const [article, categories, articleAds, recommendedArticles] = await Promise.all([
    isFullUuid(id) ? getPublishedArticleRowById(id) : getPublishedArticleRowBySlugId(id),
    getCategories(),
    showAds ? getActiveSiteAdsForArticle() : Promise.resolve([]),
    getRecommendedArticles(id, 8),
  ])

  if (!article) {
    notFound()
  }

  const canonical = getArticlePath(article.id, article.title)
  if (canonical !== `/news/${id}`) redirect(canonical)

  const categoryIds = article.categoryId ? [article.categoryId] : []
  const back = newsArticleBackFromCategoryIds(categoryIds, categories)
  const categoryByline = newsArticleCategoryBylineFromIds(categoryIds, categories)
  const date = article.createdAt.toISOString().slice(0, 10)

  const adSlot =
    showAds && articleAds.length > 0 ? <SiteAdSpots ads={articleAds} /> : undefined

  function extractBodyImages(body: string): { src: string; alt: string }[] {
    try {
      const doc = JSON.parse(body)
      if (!doc.content) return []
      return doc.content
        .filter((node: any) => node.type === "image" && node.attrs?.src)
        .map((node: any) => ({ src: node.attrs.src, alt: node.attrs.alt || "" }))
    } catch {
      return []
    }
  }

  const bodyImages = extractBodyImages(article.body)

  if (article.isMemberOnly && !subscribed) {
    return (
      <>
        <TrackArticleView articleId={article.id} />
        <SubscriptionPageGate
          title={article.title}
          coverImageUrl={article.coverImageUrl}
          back={back}
        />
      </>
    )
  }

  const sidebarRecs = recommendedArticles.slice(0, 4)

  return (
    <>
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
                <ArticleHighlights
                  items={[
                    "مختبرات محلية تطلق نموذجاً لغوياً كبيراً (LLM) متخصصاً في المجالات التقنية بالعربية",
                    "النموذج يدعم فهم المصطلحات التقنية العربية والتعامل مع اللهجات في السياقات المتخصصة",
                    "تم تدريبه على مجموعة ضخمة من البيانات العربية شملت كتباً وأوراقاً بحثية ووثائق تقنية",
                    "التطبيقات تشمل الترجمة التقنية، شرح الأكواد، وتحليل المستندات الفنية بالعربية",
                    "سيتم إتاحة النموذج مجاناً للباحثين والمطورين عبر API مفتوح",
                  ]}
                />
                <NewsArticleView
                  adSlot={adSlot}
                >
                  <ArticleTiptapReadOnly
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
                    const imgSrc = a.coverImageUrl?.trim() || "https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev/landing/0f8e1a7b62c7f5cc2a650b40d8cd2168.jpg"
                    return (
                      <Link
                        key={a.id}
                        href={getArticlePath(a.id)}
                        className="group flex gap-3 text-right"
                      >
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                          <Image
                            src={imgSrc}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="96px"
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

function isFullUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}
