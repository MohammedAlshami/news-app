import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ArticleTiptapReadOnly } from "@/components/article-tiptap-read-only"
import { NewsArticleView } from "@/components/news-article-view"
import { SiteAdSpots } from "@/components/site-ad-spots"
import { Button } from "@/components/ui/button"
import {
  newsArticleBackFromCategoryIds,
  newsArticleCategoryBylineFromIds,
} from "@/lib/news-article-display"
import { getCategories } from "@/lib/categories"
import { getActiveSiteAdsForArticle } from "@/lib/db-site-ads.server"
import { getPublishedArticleRowById } from "@/lib/articles"
import { areSiteAdsEnabled } from "@/lib/site-ads-enabled"
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
  const article = await getPublishedArticleRowById(id)
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
  const showAds = areSiteAdsEnabled()
  const [article, categories, articleAds] = await Promise.all([
    getPublishedArticleRowById(id),
    getCategories(),
    showAds ? getActiveSiteAdsForArticle() : Promise.resolve([]),
  ])

  if (!article) {
    notFound()
  }

  const categoryIds = article.categoryId ? [article.categoryId] : []
  const back = newsArticleBackFromCategoryIds(categoryIds, categories)
  const categoryByline = newsArticleCategoryBylineFromIds(categoryIds, categories)
  const date = article.createdAt.toISOString().slice(0, 10)

  const adSlot =
    showAds && articleAds.length > 0 ? <SiteAdSpots ads={articleAds} /> : undefined

  return (
    <NewsArticleView
      back={back}
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href="/">{ar.home}</Link>
        </Button>
      }
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
  )
}
