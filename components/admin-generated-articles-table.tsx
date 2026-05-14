"use client"

import { Eye, ExternalLink, MoreVertical } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { AdminSourceArticlesModal, type SourceArticle } from "@/components/admin-source-articles-modal"
import { AdminGeneratedArticlePreviewModal } from "@/components/admin-generated-article-preview-modal"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatArticleDate } from "@/lib/format-date"
import type { GeneratedArticleListItem } from "@/lib/db-generated-articles.server"

type Props = {
  articles: GeneratedArticleListItem[]
}

export function AdminGeneratedArticlesTable({ articles }: Props) {
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [sourcesTitle, setSourcesTitle] = useState("")
  const [sources, setSources] = useState<SourceArticle[]>([])
  const [sourcesLoading, setSourcesLoading] = useState(false)

  async function openSources(article: GeneratedArticleListItem) {
    setSourcesTitle(article.topicTitle ?? article.title)
    setSourcesOpen(true)
    setSourcesLoading(true)
    try {
      // Fetch source articles by their IDs via the topic endpoint
      if (article.topicId) {
        const res = await fetch(`/api/topics/${article.topicId}/sources`)
        if (res.ok) {
          const data = await res.json() as { sources: SourceArticle[] }
          setSources(data.sources ?? [])
        }
      } else {
        setSources([])
      }
    } finally {
      setSourcesLoading(false)
    }
  }

  if (articles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        لا توجد مقالات مولّدة حتى الآن.
      </p>
    )
  }

  return (
    <>
      <AdminGeneratedArticlePreviewModal
        articleId={previewId}
        open={previewOpen}
        onOpenChange={(next) => {
          setPreviewOpen(next)
          if (!next) setPreviewId(null)
        }}
      />

      <AdminSourceArticlesModal
        open={sourcesOpen}
        onOpenChange={(next) => {
          setSourcesOpen(next)
          if (!next) { setSources([]); setSourcesTitle("") }
        }}
        topicTitle={sourcesTitle}
        articles={sourcesLoading ? [] : sources}
      />

      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg border bg-card">
        <Table dir="rtl">
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="h-12 w-16 px-3 text-start font-medium">صورة</TableHead>
              <TableHead className="h-12 min-w-[16rem] px-4 text-start font-medium">العنوان</TableHead>
              <TableHead className="h-12 min-w-[10rem] px-4 text-start font-medium">الموضوع</TableHead>
              <TableHead className="h-12 w-[7rem] px-4 text-start font-medium">المصادر</TableHead>
              <TableHead className="h-12 w-[9rem] px-4 text-start font-medium">تاريخ الإنشاء</TableHead>
              <TableHead className="sticky left-0 z-20 h-12 min-w-[5rem] bg-card px-2 text-center font-medium shadow-[2px_0_0_0_theme(colors.border)]">
                إجراءات
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((a) => (
              <TableRow key={a.id} className="hover:bg-muted/50">
                <TableCell className="h-16 px-3">
                  {a.coverImageUrl ? (
                    <div className="relative h-10 w-14 overflow-hidden rounded bg-muted">
                      <Image
                        src={a.coverImageUrl}
                        alt={a.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-14 rounded bg-muted" />
                  )}
                </TableCell>
                <TableCell className="h-16 max-w-[22rem] px-4 text-start font-medium">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="block max-w-full truncate" title={a.title}>
                      {a.title}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {a.excerpt.slice(0, 80)}{a.excerpt.length > 80 ? "…" : ""}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="h-16 max-w-[12rem] px-4 text-start text-sm text-muted-foreground">
                  {a.topicTitle ? (
                    <span className="block truncate" title={a.topicTitle}>
                      {a.topicTitle}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell className="h-16 px-4 text-start text-sm text-muted-foreground">
                  <span className="inline-flex items-center rounded-full border border-border/70 bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                    {a.sourceArticleIds.length}
                  </span>
                </TableCell>
                <TableCell className="h-16 px-4 text-start text-sm text-muted-foreground">
                  {formatArticleDate(
                    (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt as unknown as number))
                      .toISOString()
                      .slice(0, 10),
                  )}
                </TableCell>
                <TableCell className="sticky left-0 z-10 h-16 min-w-[5rem] bg-card px-2 text-center shadow-[2px_0_0_0_theme(colors.border)]">
                  <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreVertical className="size-4" />
                        <span className="sr-only">إجراءات</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-44">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          setPreviewId(a.id)
                          setPreviewOpen(true)
                        }}
                      >
                        <Eye className="size-4" />
                        معاينة المقال
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          openSources(a)
                        }}
                      >
                        <ExternalLink className="size-4" />
                        عرض المصادر
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
