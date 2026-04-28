"use client"

import { ExternalLink, Eye, Pencil } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { setArticlePublishedAction } from "@/app/admin/articles/actions"

import { AdminArticlePreviewModal } from "@/components/admin-article-preview-modal"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatArticleDate } from "@/lib/format-date"
import { getArticlePath } from "@/lib/site-routes"
import type { AdminArticleListItem, SiteCategory } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"

type Props = {
  articles: AdminArticleListItem[]
  categories: SiteCategory[]
  labels: {
    colTitle: string
    colDate: string
    colCategories: string
    colExcerpt: string
    colPublished: string
    colActions: string
    publishToggle: string
    openPublic: string
    edit: string
    notPublic: string
    preview: string
    viewLive: string
  }
}

function categoryNames(
  article: AdminArticleListItem,
  categories: SiteCategory[],
): string {
  const byId = new Map(categories.map((c) => [c.id, c.name] as const))
  return (
    article.categoryIds
      .map((id) => byId.get(id) ?? "—")
      .join("، ") || "—"
  )
}

export function AdminArticlesTable({
  articles,
  categories,
  labels,
}: Props) {
  const router = useRouter()
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [publishBusyId, setPublishBusyId] = useState<string | null>(null)

  if (articles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {ar.noArticles}
      </p>
    )
  }
  return (
    <>
      <AdminArticlePreviewModal
        articleId={previewId}
        open={previewOpen}
        onOpenChange={(next) => {
          setPreviewOpen(next)
          if (!next) {
            setPreviewId(null)
          }
        }}
      />
      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg border bg-card">
        <Table dir="rtl">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="h-12 min-w-[12rem] px-4 text-start font-medium">
              {labels.colTitle}
            </TableHead>
            <TableHead className="h-12 w-[7rem] px-4 text-start font-medium">
              {labels.colDate}
            </TableHead>
            <TableHead className="h-12 min-w-[10rem] px-4 text-start font-medium">
              {labels.colCategories}
            </TableHead>
            <TableHead className="h-12 min-w-[12rem] px-4 text-start font-medium">
              {labels.colExcerpt}
            </TableHead>
            <TableHead className="h-12 w-[5.5rem] px-2 text-center font-medium">
              {labels.colPublished}
            </TableHead>
            <TableHead className="h-12 min-w-[7.5rem] px-1 text-center font-medium">
              {labels.colActions}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((a) => (
            <TableRow
              key={a.id}
              className="hover:bg-muted/50"
            >
              <TableCell className="h-16 max-w-sm px-4 text-start font-medium">
                <div className="flex flex-col items-start gap-0.5">
                  <span>{a.title || "—"}</span>
                  {!a.isPublished ? (
                    <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
                      {ar.adminArticleStatusDraft}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="h-16 whitespace-nowrap px-4 text-start text-sm text-muted-foreground">
                {formatArticleDate(a.date)}
              </TableCell>
              <TableCell className="h-16 max-w-xs px-4 text-start text-sm text-muted-foreground">
                {categoryNames(a, categories)}
              </TableCell>
              <TableCell
                className="h-16 max-w-md px-4 text-start text-sm text-muted-foreground"
                title={a.excerpt}
              >
                <span className="line-clamp-2">{a.excerpt || "—"}</span>
              </TableCell>
              <TableCell className="h-16 px-2 text-center align-middle">
                <Switch
                  className="mx-auto"
                  checked={a.isPublished}
                  disabled={publishBusyId === a.id}
                  onCheckedChange={async (next) => {
                    setPublishBusyId(a.id)
                    const result = await setArticlePublishedAction(a.id, next)
                    setPublishBusyId(null)
                    if (result.ok) {
                      router.refresh()
                    }
                  }}
                  aria-label={`${labels.publishToggle}: ${a.title || a.id}`}
                />
              </TableCell>
              <TableCell className="h-16 px-0.5 text-center">
                <div className="flex flex-nowrap items-center justify-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        asChild
                      >
                        <Link
                          href={`/admin/articles/${a.id}`}
                          aria-label={labels.edit}
                        >
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{labels.edit}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label={labels.preview}
                        onClick={() => {
                          setPreviewId(a.id)
                          setPreviewOpen(true)
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{labels.preview}</TooltipContent>
                  </Tooltip>
                  {a.isPublished ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          asChild
                        >
                          <Link
                            href={getArticlePath(a.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={labels.viewLive}
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{labels.viewLive}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-dotted border-border text-muted-foreground">
                          <ExternalLink className="size-3.5 opacity-40" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{labels.notPublic}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </>
  )
}
