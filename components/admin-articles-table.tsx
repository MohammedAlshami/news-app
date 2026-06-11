"use client"

import { ExternalLink, Eye, MoreVertical, Pencil, PencilLine } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { setArticleMemberOnlyAction, setArticlePublishedAction } from "@/app/admin/articles/actions"
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
  DropdownMenuSeparator,
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
    colViews: string
    colActions: string
    publishToggle: string
    publishModalTitle: string
    publishModalDesc: string
    publishModalPublish: string
    publishModalUnpublish: string
    memberOnlyToggle: string
    memberOnlyModalTitle: string
    memberOnlyModalDesc: string
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
  const [busyId, setBusyId] = useState<string | null>(null)
  const [publishTarget, setPublishTarget] = useState<{
    id: string
    next: boolean
  } | null>(null)
  const [memberOnlyTarget, setMemberOnlyTarget] = useState<{
    id: string
    next: boolean
  } | null>(null)
  const categoryById = categoryLabelMap(categories)

  async function confirmPublish() {
    if (!publishTarget) return
    setBusyId(publishTarget.id)
    const { id, next } = publishTarget
    setPublishTarget(null)
    const result = await setArticlePublishedAction(id, next)
    setBusyId(null)
    if (result.ok) router.refresh()
  }

  async function confirmMemberOnly() {
    if (!memberOnlyTarget) return
    setBusyId(memberOnlyTarget.id)
    const { id, next } = memberOnlyTarget
    setMemberOnlyTarget(null)
    const result = await setArticleMemberOnlyAction(id, next)
    setBusyId(null)
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
        open={publishTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPublishTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{labels.publishModalTitle}</DialogTitle>
            <DialogDescription>
              {labels.publishModalDesc.replace(
                "{action}",
                publishTarget?.next ? labels.publishModalPublish : labels.publishModalUnpublish,
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-4 px-2 py-4">
            <div className="space-y-0.5">
              <span className="text-sm font-medium">{labels.publishToggle}</span>
            </div>
            <Switch
              checked={publishTarget?.next ?? false}
              onCheckedChange={(next) =>
                setPublishTarget((prev) => (prev ? { ...prev, next } : null))
              }
              aria-label={labels.publishToggle}
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button variant="outline" onClick={() => setPublishTarget(null)}>
              إلغاء
            </Button>
            <Button
              onClick={confirmPublish}
              disabled={busyId === publishTarget?.id}
            >
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={memberOnlyTarget !== null}
        onOpenChange={(open) => {
          if (!open) setMemberOnlyTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{labels.memberOnlyModalTitle}</DialogTitle>
            <DialogDescription>
              {labels.memberOnlyModalDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-4 px-2 py-4">
            <div className="space-y-0.5">
              <span className="text-sm font-medium">{labels.memberOnlyToggle}</span>
            </div>
            <Switch
              checked={memberOnlyTarget?.next ?? false}
              onCheckedChange={(next) =>
                setMemberOnlyTarget((prev) => (prev ? { ...prev, next } : null))
              }
              aria-label={labels.memberOnlyToggle}
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button variant="outline" onClick={() => setMemberOnlyTarget(null)}>
              إلغاء
            </Button>
            <Button
              onClick={confirmMemberOnly}
              disabled={busyId === memberOnlyTarget?.id}
            >
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg border bg-card">
        <Table dir="rtl">
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="h-12 w-16 px-3 text-start font-medium">صورة</TableHead>
              <TableHead className="h-12 min-w-[14rem] px-4 text-start font-medium">
                {labels.colTitle}
              </TableHead>
              <TableHead className="h-12 w-[5rem] px-2 text-center font-medium">
                {labels.colViews}
              </TableHead>
              <TableHead className="h-12 w-[7rem] px-4 text-start font-medium">
                {labels.colDate}
              </TableHead>
              <TableHead className="h-12 min-w-[8rem] px-4 text-start font-medium">
                {labels.colCategories}
              </TableHead>
              <TableHead className="h-12 min-w-[10rem] px-4 text-start font-medium">
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
                  {a.coverImageUrl ? (
                    <div className="relative h-10 w-14 overflow-hidden rounded bg-muted">
                      <Image
                        src={a.coverImageUrl}
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
                    <div className="flex flex-wrap gap-1.5">
                      {!a.isPublished ? (
                        <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
                          {ar.adminArticleStatusDraft}
                        </span>
                      ) : null}
                      {a.isMemberOnly ? (
                        <span className="text-xs font-normal text-blue-600 dark:text-blue-400">
                          {labels.memberOnlyToggle}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="h-16 w-[5rem] px-2 text-center text-sm tabular-nums text-muted-foreground">
                  {a.views.toLocaleString("ar")}
                </TableCell>
                <TableCell className="h-16 max-w-[7rem] px-4 text-start text-sm text-muted-foreground">
                  <span className="block truncate whitespace-nowrap" title={formatArticleDate(a.date)}>
                    {formatArticleDate(a.date)}
                  </span>
                </TableCell>
                <TableCell className="h-16 max-w-[8rem] px-4 text-start text-sm text-muted-foreground">
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
                <TableCell className="h-16 max-w-[12rem] px-4 text-start text-sm text-muted-foreground" title={a.excerpt}>
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          setPublishTarget({ id: a.id, next: a.isPublished })
                        }}
                      >
                        <PencilLine className="size-4" />
                        {a.isPublished ? labels.publishModalUnpublish : labels.publishModalPublish}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          setMemberOnlyTarget({ id: a.id, next: a.isMemberOnly })
                        }}
                      >
                        <PencilLine className="size-4" />
                        {labels.memberOnlyToggle}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
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
