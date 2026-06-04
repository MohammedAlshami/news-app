import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { ArticleTiptapReadOnly } from "@/components/article-tiptap-read-only"
import { NewsArticleView } from "@/components/news-article-view"
import { SubscriptionPageGate } from "@/components/subscription-page-gate"
import { TrackArticleView } from "@/components/track-article-view"
import { SiteAdSpots } from "@/components/site-ad-spots"
import {
  newsArticleBackFromCategoryIds,
  newsArticleCategoryBylineFromIds,
} from "@/lib/news-article-display"
import { getCategories } from "@/lib/categories"
import { getActiveSiteAdsForArticle } from "@/lib/db-site-ads.server"
import { getPublishedArticleRowById, getPublishedArticleRowBySlugId } from "@/lib/articles"
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
  const [article, categories, articleAds] = await Promise.all([
    isFullUuid(id) ? getPublishedArticleRowById(id) : getPublishedArticleRowBySlugId(id),
    getCategories(),
    showAds ? getActiveSiteAdsForArticle() : Promise.resolve([]),
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

  return (
    <>
      <TrackArticleView articleId={article.id} />
      <NewsArticleView
        coverImageUrl={article.coverImageUrl}
        categoryByline={categoryByline}
        date={date}
        title={article.title}
        excerpt={article.excerpt}
        adSlot={adSlot}
      >
        <ArticleTiptapReadOnly
          body={article.body}
          className="min-w-0 max-w-full [&_.simple-editor-content]:overflow-x-hidden"
        />
      </NewsArticleView>
    </>
  )
}

function isFullUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}
