import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CreateArticleForm } from "@/components/create-article-form"
import { getAdminArticleById } from "@/lib/db-articles.server"
import { getCategories } from "@/lib/categories"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const row = await getAdminArticleById(id)
  if (!row) {
    return { title: "تعديل المقال" }
  }
  const t = row.title.trim()
  return {
    title: t ? `${t} | إدارة` : "تعديل المقال",
  }
}

export default async function AdminEditArticlePage({ params }: PageProps) {
  const { id } = await params
  const row = await getAdminArticleById(id)
  if (!row) {
    notFound()
  }
  const categories = await getCategories()
  const initialCategoryIds = row.categoryId ? [row.categoryId] : []

  return (
    <div className="flex h-full min-h-0 flex-col p-4 md:p-6 lg:p-8">
      <CreateArticleForm
        key={row.id}
        articleId={row.id}
        initialCoverImageUrl={row.coverImageUrl}
        initialTitle={row.title}
        initialExcerpt={row.excerpt}
        initialCategoryIds={initialCategoryIds}
        initialIsPublished={row.isPublished}
        initialIsMemberOnly={row.isMemberOnly}
        initialBodyJson={row.body}
        initialUpdatedAt={row.updatedAt.toISOString()}
        categories={categories}
      />
    </div>
  )
}
