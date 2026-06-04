import type { Metadata } from "next"

import { notFound } from "next/navigation"



import { ArticleTiptapReadOnly } from "@/components/article-tiptap-read-only"

import { NewsArticleView } from "@/components/news-article-view"

import { getAdminArticleById } from "@/lib/db-articles.server"

import { getCategories } from "@/lib/categories"

import { newsArticleCategoryBylineFromIds } from "@/lib/news-article-display"

import { ar } from "@/lib/ui-ar"



export const dynamic = "force-dynamic"



type PageProps = {

  params: Promise<{ id: string }>

}



export async function generateMetadata({ params }: PageProps): Promise<Metadata> {

  const { id } = await params

  const row = await getAdminArticleById(id)

  if (!row) {

    return { title: ar.adminArticlePreviewPageTitle, robots: { index: false } }

  }

  return {

    title: `${ar.adminArticlePreview} — ${row.title.trim() || "…"}`,

    description: row.excerpt,

    robots: { index: false, follow: false },

  }

}



/**

 * Single “رجوع” control: returns to the article editor. No admin sidebar

 * (see `AdminLayoutShell` when the path is `/admin/articles/preview/...`).

 */

export default async function AdminArticlePreviewPage({ params }: PageProps) {

  const { id } = await params

  const [row, categories] = await Promise.all([

    getAdminArticleById(id),

    getCategories(),

  ])

  if (!row) {

    notFound()

  }



  const categoryIds = row.categoryId ? [row.categoryId] : []

  const categoryByline = newsArticleCategoryBylineFromIds(categoryIds, categories)

  const date = row.createdAt.toISOString().slice(0, 10)



  return (

    <NewsArticleView

      coverImageUrl={row.coverImageUrl}

      categoryByline={categoryByline}

      date={date}

      title={row.title}

      excerpt={row.excerpt}

    >

      <ArticleTiptapReadOnly body={row.body} />

    </NewsArticleView>

  )

}

