"use client"

import { ExternalLink, Eye, MoreVertical } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { AdminScrapedArticlePreviewModal } from "@/components/admin-scraped-article-preview-modal"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import type { AdminScrapedNewsListItem } from "@/lib/db-scraped-news.server"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

type Props = {
  articles: AdminScrapedNewsListItem[]
  labels: {
    colTitle: string
    colSource: string
    colCategory: string
    colScrapedAt: string
    colPublishedAt: string
    colExcerpt: string
    colActions: string
    viewOriginal: string
    preview: string
  }
}

export function AdminScrapedArticlesTable({ articles, labels }: Props) {
  const [previewArticle, setPreviewArticle] = useState<AdminScrapedNewsListItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  if (articles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {ar.noArticles}
      </p>
    )
  }

  return (
    <>
      <AdminScrapedArticlePreviewModal
        article={previewArticle}
        open={previewOpen}
        onOpenChange={(next) => {
          setPreviewOpen(next)
          if (!next) setPreviewArticle(null)
        }}
      />
    <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg border bg-card">
      <Table dir="rtl">
          <TableHeader>
          <TableRow className="border-b hover:bg-transparent">
            <TableHead className="h-12 w-16 px-3 text-start font-medium">صورة</TableHead>
            <TableHead className="h-12 min-w-[14rem] px-4 text-start font-medium">
              {labels.colTitle}
            </TableHead>
            <TableHead className="h-12 w-[8rem] px-4 text-start font-medium">
              {labels.colSource}
            </TableHead>
            <TableHead className="h-12 w-[8rem] px-4 text-start font-medium">
              {labels.colCategory}
            </TableHead>
            <TableHead className="h-12 w-[7rem] px-4 text-start font-medium">
              {labels.colScrapedAt}
            </TableHead>
            <TableHead className="h-12 w-[7rem] px-4 text-start font-medium">
              {labels.colPublishedAt}
            </TableHead>
            <TableHead className="h-12 min-w-[14rem] px-4 text-start font-medium">
              {labels.colExcerpt}
            </TableHead>
            <TableHead className="sticky left-0 z-20 h-12 min-w-[5rem] bg-card px-2 text-center font-medium shadow-[2px_0_0_0_theme(colors.border)]">
              {labels.colActions}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((a) => (
            <TableRow key={a.id} className="hover:bg-muted/50">
              <TableCell className="h-16 px-3">
                {a.imageUrl ? (
                  <div className="relative h-10 w-14 overflow-hidden rounded bg-muted">
                    <Image
                      src={a.imageUrl}
                      alt={a.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-14 rounded bg-muted" />
                )}
              </TableCell>
              <TableCell className="h-16 max-w-[22rem] px-4 text-start font-medium">
                <div className="flex min-w-0 flex-col items-start gap-0.5">
                  <span className="block max-w-full truncate" title={a.title}>
                    {a.title || "—"}
                  </span>
                  {a.query ? (
                    <span className="text-xs font-normal text-muted-foreground">
                      Query: {a.query}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="h-16 max-w-[8rem] px-4 text-start text-sm">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border border-border/70 bg-muted px-2 py-0.5 text-xs font-medium text-foreground whitespace-nowrap",
                  )}
                  title={a.source}
                >
                  {a.source}
                </span>
              </TableCell>
              <TableCell className="h-16 max-w-[8rem] px-4 text-start text-sm text-muted-foreground">
                <span className="block truncate whitespace-nowrap" title={a.category}>
                  {a.category}
                </span>
              </TableCell>
              <TableCell className="h-16 max-w-[7rem] px-4 text-start text-sm text-muted-foreground">
                <span className="block truncate whitespace-nowrap" title={formatArticleDate(a.scrapedAt.toISOString().slice(0, 10))}>
                  {formatArticleDate(a.scrapedAt.toISOString().slice(0, 10))}
                </span>
              </TableCell>
              <TableCell className="h-16 max-w-[7rem] px-4 text-start text-sm text-muted-foreground">
                <span className="block truncate whitespace-nowrap" title={a.publishedAt ? formatArticleDate(a.publishedAt.slice(0, 10)) : "—"}>
                  {a.publishedAt ? formatArticleDate(a.publishedAt.slice(0, 10)) : "—"}
                </span>
              </TableCell>
              <TableCell className="h-16 max-w-[18rem] px-4 text-start text-sm text-muted-foreground" title={a.excerpt}>
                <span className="block truncate whitespace-nowrap">{a.excerpt || "—"}</span>
              </TableCell>
              <TableCell className="sticky left-0 z-10 h-16 min-w-[5rem] bg-card px-2 text-center shadow-[2px_0_0_0_theme(colors.border)]">
                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <MoreVertical className="size-4" />
                      <span className="sr-only">{labels.colActions}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-40">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        setPreviewArticle(a)
                        setPreviewOpen(true)
                      }}
                    >
                      <Eye className="size-4" />
                      {labels.preview}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={a.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" />
                        {labels.viewOriginal}
                      </Link>
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
