"use client"

import { ExternalLink, Eye, MoreVertical, Pencil, PencilLine } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { setArticlePublishedAction } from "@/app/admin/articles/actions"
import { AdminArticlePreviewModal } from "@/components/admin-article-preview-modal"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatArticleDate } from "@/lib/format-date"
import { getArticlePath } from "@/lib/site-routes"
import type { AdminArticleListItem, SiteCategory } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

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

function categoryNames(article: AdminArticleListItem, categories: SiteCategory[]) {
  const byId = new Map(categories.map((c) => [c.id, c.name] as const))
  return article.categoryIds.map((id) => byId.get(id) ?? "—").join("، ") || "—"
}

function categoryLabelMap(categories: SiteCategory[]) {
  return new Map(categories.map((c) => [c.id, c.name] as const))
}

export function AdminArticlesTable({ articles, categories, labels }: Props) {
  const router = useRouter()
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [publishBusyId, setPublishBusyId] = useState<string | null>(null)
  const [toggleTarget, setToggleTarget] = useState<{
    id: string
    next: boolean
  } | null>(null)
  const categoryById = categoryLabelMap(categories)

  async function confirmToggle() {
    if (!toggleTarget) return
    setPublishBusyId(toggleTarget.id)
    setToggleTarget(null)
    const result = await setArticlePublishedAction(toggleTarget.id, toggleTarget.next)
    setPublishBusyId(null)
    if (result.ok) router.refresh()
  }

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
          if (!next) setPreviewId(null)
        }}
      />
      <Dialog
        open={toggleTarget !== null}
        onOpenChange={(open) => {
          if (!open) setToggleTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد تغيير النشر</DialogTitle>
            <DialogDescription>
              هل تريد {toggleTarget?.next ? "نشر" : "إلغاء نشر"} هذا المقال؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button variant="outline" onClick={() => setToggleTarget(null)}>
              إلغاء
            </Button>
            <Button onClick={confirmToggle}>تأكيد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg border bg-card">
        <Table dir="rtl">
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="h-12 min-w-[14rem] px-4 text-start font-medium">
                {labels.colTitle}
              </TableHead>
              <TableHead className="h-12 w-[7rem] px-4 text-start font-medium">
                {labels.colDate}
              </TableHead>
              <TableHead className="h-12 min-w-[12rem] px-4 text-start font-medium">
                {labels.colCategories}
              </TableHead>
              <TableHead className="h-12 min-w-[14rem] px-4 text-start font-medium">
                {labels.colExcerpt}
              </TableHead>
              <TableHead className="h-12 w-[5.5rem] px-2 text-center font-medium">
                {labels.colPublished}
              </TableHead>
              <TableHead className="h-12 min-w-[5rem] px-2 text-center font-medium">
                {labels.colActions}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((a) => (
              <TableRow key={a.id} className="hover:bg-muted/50">
                <TableCell className="h-16 max-w-[22rem] px-4 text-start font-medium">
                  <div className="flex min-w-0 flex-col items-start gap-0.5">
                    <span className="block max-w-full truncate" title={a.title}>
                      {a.title || "—"}
                    </span>
                    {!a.isPublished ? (
                      <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
                        {ar.adminArticleStatusDraft}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="h-16 max-w-[7rem] px-4 text-start text-sm text-muted-foreground">
                  <span className="block truncate whitespace-nowrap" title={formatArticleDate(a.date)}>
                    {formatArticleDate(a.date)}
                  </span>
                </TableCell>
                <TableCell className="h-16 max-w-[12rem] px-4 text-start text-sm text-muted-foreground">
                  <div className="flex min-w-0 flex-wrap gap-1" title={categoryNames(a, categories)}>
                    {a.categoryIds.length > 0 ? (
                      a.categoryIds.map((id) => {
                        const label = categoryById.get(id) ?? "—"
                        return (
                          <span
                            key={id}
                            className={cn(
                              "inline-flex max-w-full items-center rounded-full border border-border/70 bg-muted px-2 py-0.5 text-xs font-medium text-foreground whitespace-nowrap",
                            )}
                            title={label}
                          >
                            <span className="block max-w-[8rem] truncate">{label}</span>
                          </span>
                        )
                      })
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="h-16 max-w-[18rem] px-4 text-start text-sm text-muted-foreground" title={a.excerpt}>
                  <span className="block truncate whitespace-nowrap">{a.excerpt || "—"}</span>
                </TableCell>
                <TableCell className="h-16 px-2 text-center align-middle">
                  <Switch
                    className="mx-auto"
                    checked={a.isPublished}
                    disabled={publishBusyId === a.id}
                    onCheckedChange={(next) => setToggleTarget({ id: a.id, next })}
                    aria-label={`${labels.publishToggle}: ${a.title || a.id}`}
                  />
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
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/articles/${a.id}`}>
                          <Pencil className="size-4" />
                          {labels.edit}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          setPreviewId(a.id)
                          setPreviewOpen(true)
                        }}
                      >
                        <Eye className="size-4" />
                        {labels.preview}
                      </DropdownMenuItem>
                    {a.isPublished ? (
                      <DropdownMenuItem asChild>
                        <Link href={getArticlePath(a.id)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-4" />
                          {labels.viewLive}
                        </Link>
                      </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled>
                          <PencilLine className="size-4" />
                          {labels.notPublic}
                        </DropdownMenuItem>
                      )}
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
