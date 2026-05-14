"use client"

import { Eye, MoreVertical } from "lucide-react"
import { useState } from "react"

import { AdminSourceArticlesModal, type SourceArticle } from "@/components/admin-source-articles-modal"
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
import type { Topic } from "@/db/schema"

type Props = {
  topics: Topic[]
}

export function AdminTopicsTable({ topics }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [sources, setSources] = useState<SourceArticle[]>([])
  const [loading, setLoading] = useState(false)

  async function openSources(topic: Topic) {
    setSelectedTopic(topic)
    setModalOpen(true)
    setLoading(true)
    try {
      const res = await fetch(`/api/topics/${topic.id}/sources`)
      if (res.ok) {
        const data = await res.json() as { sources: SourceArticle[] }
        setSources(data.sources ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  if (topics.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        لا توجد مواضيع حتى الآن.
      </p>
    )
  }

  return (
    <>
      <AdminSourceArticlesModal
        open={modalOpen}
        onOpenChange={(next) => {
          setModalOpen(next)
          if (!next) { setSelectedTopic(null); setSources([]) }
        }}
        topicTitle={selectedTopic?.title ?? ""}
        articles={loading ? [] : sources}
      />

      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg border bg-card">
        <Table dir="rtl">
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="h-12 min-w-[16rem] px-4 text-start font-medium">الموضوع</TableHead>
              <TableHead className="h-12 w-[7rem] px-4 text-start font-medium">عدد المقالات</TableHead>
              <TableHead className="h-12 w-[9rem] px-4 text-start font-medium">تاريخ الإنشاء</TableHead>
              <TableHead className="h-12 w-[9rem] px-4 text-start font-medium">آخر تحديث</TableHead>
              <TableHead className="sticky left-0 z-20 h-12 min-w-[5rem] bg-card px-2 text-center font-medium shadow-[2px_0_0_0_theme(colors.border)]">
                إجراءات
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.map((t) => (
              <TableRow key={t.id} className="hover:bg-muted/50">
                <TableCell className="h-16 max-w-[24rem] px-4 text-start font-medium">
                  <span className="block max-w-full truncate" title={t.title}>
                    {t.title}
                  </span>
                </TableCell>
                <TableCell className="h-16 px-4 text-start text-sm text-muted-foreground">
                  <span className="inline-flex items-center rounded-full border border-border/70 bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                    {t.articleCount}
                  </span>
                </TableCell>
                <TableCell className="h-16 px-4 text-start text-sm text-muted-foreground">
                  {formatArticleDate(
                    (t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt as number))
                      .toISOString()
                      .slice(0, 10),
                  )}
                </TableCell>
                <TableCell className="h-16 px-4 text-start text-sm text-muted-foreground">
                  {formatArticleDate(
                    (t.updatedAt instanceof Date ? t.updatedAt : new Date(t.updatedAt as number))
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
                          openSources(t)
                        }}
                      >
                        <Eye className="size-4" />
                        عرض المقالات المصدر
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
