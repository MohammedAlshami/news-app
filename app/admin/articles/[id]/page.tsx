import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CreateArticleForm } from "@/components/create-article-form"
import { Button } from "@/components/ui/button"
import { getAdminArticleById } from "@/lib/db-articles.server"
import { parseArticleBodyToTiptapDoc } from "@/lib/parse-article-body"
import { getCategories } from "@/lib/categories"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const row = await getAdminArticleById(id)
  if (!row) {
    return { title: ar.adminArticleEditMetaTitle }
  }
  const t = row.title.trim()
  return {
    title: t ? `${t} | ${ar.adminKicker}` : ar.adminArticleEditMetaTitle,
  }
}

export default async function AdminEditArticlePage({ params }: PageProps) {
  const { id } = await params
  const row = await getAdminArticleById(id)
  if (!row) {
    notFound()
  }
  const categories = await getCategories()
  const initialDocument = parseArticleBodyToTiptapDoc(row.body)
  const initialCategoryIds = row.categoryId ? [row.categoryId] : []
  const heading = row.title.trim() || ar.adminArticleStatusDraft

  return (
    <div
      className={cn("flex-1 p-4 md:p-6 lg:p-8")}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {ar.adminArticleEditKicker}
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            {heading}
            {!row.isPublished ? (
              <span className="ms-2 text-base font-normal text-muted-foreground">
                ({ar.adminArticleStatusDraft})
              </span>
            ) : null}
          </h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/articles">{ar.adminArticleCancel}</Link>
        </Button>
      </div>
      <CreateArticleForm
        key={row.id}
        articleId={row.id}
        initialTitle={row.title}
        initialExcerpt={row.excerpt}
        initialDocument={initialDocument}
        initialCategoryIds={initialCategoryIds}
        initialCoverImageUrl={row.coverImageUrl}
        initialIsPublished={row.isPublished}
        categories={categories}
      />
    </div>
  )
}
