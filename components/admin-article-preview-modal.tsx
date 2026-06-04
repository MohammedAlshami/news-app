"use client"

import { useEffect, useState } from "react"

import {
  getAdminArticlePreviewDataAction,
  type AdminArticlePreviewData,
} from "@/app/admin/articles/actions"
import { ArticleTiptapReadOnly } from "@/components/article-tiptap-read-only"
import { NewsArticleView } from "@/components/news-article-view"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ar } from "@/lib/ui-ar"

type Props = {
  articleId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminArticlePreviewModal({
  articleId,
  open,
  onOpenChange,
}: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AdminArticlePreviewData | null>(null)

  useEffect(() => {
    if (!open || !articleId) {
      setData(null)
      setError(null)
      setPending(false)
      return
    }

    let cancelled = false
    setPending(true)
    setError(null)
    setData(null)

    void getAdminArticlePreviewDataAction(articleId).then((r) => {
      if (cancelled) return
      setPending(false)
      if (r.ok === false) {
        setError(r.error)
        setData(null)
        return
      }
      setData(r.data)
    })

    return () => {
      cancelled = true
    }
  }, [open, articleId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="flex max-h-[92vh] max-w-[calc(100%-2rem)] min-w-0 flex-col gap-0 overflow-hidden p-0 pt-12 sm:max-w-3xl"
        showCloseButton
      >
        <DialogTitle className="sr-only">{ar.adminArticlePreview}</DialogTitle>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4">
          {pending ? (
            <div className="space-y-4 py-6">
              <Skeleton className="h-8 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="mt-8 h-40 w-full rounded-lg" />
            </div>
          ) : null}

          {!pending && error ? (
            <p className="px-4 py-10 text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {!pending && data ? (
            <NewsArticleView
              embedded
              categoryByline={data.categoryByline}
              date={data.date}
              title={data.title}
              excerpt={data.excerpt}
            >
              <ArticleTiptapReadOnly
                body={data.body}
                className="min-w-0 max-w-full [&_.simple-editor-content]:overflow-x-hidden"
              />
            </NewsArticleView>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
