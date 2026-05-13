"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

import { ArticleTiptapReadOnly } from "@/components/article-tiptap-read-only"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatArticleDate } from "@/lib/format-date"
import type { AdminScrapedNewsListItem } from "@/lib/db-scraped-news.server"
import { ar } from "@/lib/ui-ar"

type Props = {
  article: AdminScrapedNewsListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminScrapedArticlePreviewModal({
  article,
  open,
  onOpenChange,
}: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !article) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92vh] max-w-[calc(100%-2rem)] min-w-0 flex-col gap-0 overflow-hidden p-0 pt-12 sm:max-w-3xl"
        dir="rtl"
        showCloseButton
      >
        <DialogTitle className="sr-only">معاينة المقال المستخرج</DialogTitle>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-6">
          <article className="space-y-6">
          {article.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold leading-tight">
                {article.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center rounded-full border border-border/70 bg-muted px-3 py-1 font-medium">
                {article.source}
              </span>
              <span>{article.category}</span>
              {article.publishedAt && (
                <span>
                  {ar.adminArticlesColDate}:{" "}
                  {formatArticleDate(article.publishedAt.slice(0, 10))}
                </span>
              )}
              <span>
                تاريخ الاستخراج:{" "}
                {formatArticleDate(article.scrapedAt.toISOString().slice(0, 10))}
              </span>
            </div>

            {article.query && (
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <span className="text-sm font-medium">استعلام البحث: </span>
                <span className="text-sm text-muted-foreground">
                  {article.query}
                </span>
              </div>
            )}

            {article.excerpt && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">الملخص</h2>
                <p className="leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
              </div>
            )}

            {article.content && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">المحتوى</h2>
                <ArticleTiptapReadOnly body={article.content} />
              </div>
            )}

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">الرابط الأصلي</h2>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-all text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {article.url}
              </a>
            </div>
          </div>
        </article>
        </div>
      </DialogContent>
    </Dialog>
  )
}
