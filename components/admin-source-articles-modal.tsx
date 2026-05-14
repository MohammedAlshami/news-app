"use client"

import { ExternalLink } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatArticleDate } from "@/lib/format-date"

export type SourceArticle = {
  id: string
  title: string
  excerpt: string
  url: string
  source: string
  imageUrl?: string | null
  publishedAt?: string | null
  scrapedAt: Date | number
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  topicTitle: string
  articles: SourceArticle[]
}

export function AdminSourceArticlesModal({ open, onOpenChange, topicTitle, articles }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92vh] max-w-[calc(100%-2rem)] min-w-0 flex-col gap-0 overflow-hidden p-0 pt-12 sm:max-w-3xl"
        dir="rtl"
        showCloseButton
      >
        <DialogTitle className="sr-only">المقالات المصدر: {topicTitle}</DialogTitle>

        <div className="border-b px-6 pb-4">
          <p className="text-xs font-medium text-muted-foreground">المقالات المصدر</p>
          <h2 className="text-lg font-semibold leading-tight">{topicTitle}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{articles.length} مقال</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="space-y-4">
            {articles.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد مقالات مصدر.</p>
            ) : (
              articles.map((a) => (
                <div
                  key={a.id}
                  className="flex gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40"
                >
                  {a.imageUrl && (
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={a.imageUrl}
                        alt={a.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{a.title}</p>
                    {a.excerpt && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{a.excerpt}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border/70 bg-muted px-2 py-0.5 font-medium text-foreground">
                        {a.source}
                      </span>
                      {a.publishedAt && (
                        <span>{formatArticleDate(a.publishedAt.slice(0, 10))}</span>
                      )}
                      <span>استُخرج: {formatArticleDate(new Date(a.scrapedAt as unknown as number).toISOString().slice(0, 10))}</span>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400"
                      asChild
                    >
                      <a href={a.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="me-1 size-3" />
                        عرض المقال الأصلي
                      </a>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
