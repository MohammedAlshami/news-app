"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import { ArticleTiptapReadOnly } from "@/components/article-tiptap-read-only"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatArticleDate } from "@/lib/format-date"
import type { GeneratedArticleWithSources } from "@/lib/db-generated-articles.server"

type Props = {
  articleId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminGeneratedArticlePreviewModal({ articleId, open, onOpenChange }: Props) {
  const [mounted, setMounted] = useState(false)
  const [article, setArticle] = useState<GeneratedArticleWithSources | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open || !articleId) { setArticle(null); return }
    setLoading(true)
    fetch(`/api/generated-articles/${articleId}`)
      .then((r) => r.json())
      .then((data: { article: GeneratedArticleWithSources }) => setArticle(data.article ?? null))
      .catch(() => setArticle(null))
      .finally(() => setLoading(false))
  }, [open, articleId])

  if (!mounted) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92vh] max-w-[calc(100%-2rem)] min-w-0 flex-col gap-0 overflow-hidden p-0 pt-12 sm:max-w-3xl"
        dir="rtl"
        showCloseButton
      >
        <DialogTitle className="sr-only">معاينة المقال المولّد</DialogTitle>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-6">
          {loading && (
            <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
          )}
          {!loading && !article && (
            <p className="text-sm text-muted-foreground">تعذّر تحميل المقال.</p>
          )}
          {!loading && article && (
            <article className="space-y-6">
              {article.coverImageUrl && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={article.coverImageUrl}
                    alt={article.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              <div className="space-y-4">
                <h1 className="text-2xl font-bold leading-tight">{article.title}</h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {article.topicTitle && (
                    <span className="inline-flex items-center rounded-full border border-border/70 bg-muted px-3 py-1 font-medium text-foreground">
                      {article.topicTitle}
                    </span>
                  )}
                  <span>
                    {formatArticleDate(
                      (article.createdAt instanceof Date
                        ? article.createdAt
                        : new Date(article.createdAt as unknown as number)
                      ).toISOString().slice(0, 10),
                    )}
                  </span>
                  <span className="text-xs">
                    {article.sourceArticleIds.length} مصادر
                  </span>
                </div>

                {article.excerpt && (
                  <div className="rounded-lg border border-border bg-muted/50 p-4">
                    <p className="text-sm leading-relaxed">{article.excerpt}</p>
                  </div>
                )}

                <ArticleTiptapReadOnly body={article.body} />

                {/* Additional images from sources */}
                {article.imageUrls.length > 1 && (
                  <div className="space-y-2">
                    <h2 className="text-base font-semibold">صور المصادر</h2>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {article.imageUrls.slice(1).map((url, i) => (
                        <div key={i} className="relative aspect-video overflow-hidden rounded-md bg-muted">
                          <Image src={url} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
