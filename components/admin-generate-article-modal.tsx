"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

import { ArticleTiptapReadOnly } from "@/components/article-tiptap-read-only"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Topic = {
  id: string
  title: string
  articleCount?: number
}

type SourceArticle = {
  id: string
  title: string
  excerpt: string
  url: string
  source: string
  imageUrl: string | null
  publishedAt: string | null
  scrapedAt: Date
  content?: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminGenerateArticleModal({ open, onOpenChange }: Props) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [articles, setArticles] = useState<SourceArticle[]>([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [previewArticle, setPreviewArticle] = useState<SourceArticle | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Fetch topics when modal opens
  useEffect(() => {
    if (open) {
      setLoadingTopics(true)
      fetch("/api/topics")
        .then((res) => res.json())
        .then((data) => {
          setTopics(data.topics ?? [])
        })
        .catch(() => setError("فشل تحميل المواضيع"))
        .finally(() => setLoadingTopics(false))
    }
  }, [open])

  // Fetch articles when topic is selected
  useEffect(() => {
    if (selectedTopic) {
      setLoadingArticles(true)
      fetch(`/api/topics/${selectedTopic.id}/sources`)
        .then((res) => res.json())
        .then((data) => {
          setArticles(data.sources ?? [])
        })
        .catch(() => setError("فشل تحميل المقالات"))
        .finally(() => setLoadingArticles(false))
    } else {
      setArticles([])
    }
  }, [selectedTopic])

  const handleGenerate = async () => {
    if (!selectedTopic) return

    setPending(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(
        `/api/cron/generate-articles?topicId=${selectedTopic.id}&limit=1`
      )
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Generation failed")
      }

      setResult(`تم توليد المقالة بنجاح!`)

      // Refresh the page after successful generation
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setPending(false)
    }
  }

  const handleArticleClick = async (article: SourceArticle) => {
    setPreviewArticle(article)
    setPreviewOpen(true)
    
    // Fetch full article with content
    try {
      const res = await fetch(`/api/scraped-news/${article.id}`)
      const data = await res.json()
      if (data.article) {
        setPreviewArticle(data.article)
      }
    } catch (err) {
      console.error("Failed to fetch article content:", err)
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          onOpenChange(o)
          if (!o) {
            setError(null)
            setResult(null)
            setSelectedTopic(null)
            setArticles([])
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>توليد مقالة</DialogTitle>
          </DialogHeader>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {result ? (
            <p className="text-sm text-green-600" role="status">
              {result}
            </p>
          ) : null}

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>اختر الموضوع</Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-full justify-between"
                    disabled={loadingTopics}
                  >
                    {selectedTopic
                      ? selectedTopic.title
                      : loadingTopics
                        ? "جاري التحميل..."
                        : "اختر موضوع..."}
                    <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ابحث عن موضوع..." />
                    <CommandList>
                      <CommandEmpty>لم يتم العثور على مواضيع</CommandEmpty>
                      <CommandGroup>
                        {topics.map((topic) => (
                          <CommandItem
                            key={topic.id}
                            value={topic.title}
                            onSelect={() => {
                              setSelectedTopic(topic)
                              setPopoverOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "me-2 h-4 w-4",
                                selectedTopic?.id === topic.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {topic.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedTopic && (
              <div className="space-y-2">
                <Label>المقالات في هذا الموضوع ({articles.length})</Label>
                {loadingArticles ? (
                  <p className="text-sm text-muted-foreground">جاري تحميل المقالات...</p>
                ) : articles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد مقالات في هذا الموضوع</p>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-2">
                    {articles.map((article) => (
                      <div
                        key={article.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50"
                        onClick={() => handleArticleClick(article)}
                      >
                        {article.imageUrl && (
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-muted">
                            <Image
                              src={article.imageUrl}
                              alt={article.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium">
                            {article.title}
                          </p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {article.source}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              disabled={pending || !selectedTopic || articles.length === 0}
              onClick={handleGenerate}
            >
              {pending ? "جاري التوليد..." : "توليد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Article Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="flex max-h-[92vh] max-w-[calc(100%-2rem)] min-w-0 flex-col gap-0 overflow-hidden p-0 pt-12 sm:max-w-3xl"
          dir="rtl"
          showCloseButton
        >
          <DialogTitle className="sr-only">معاينة المقال</DialogTitle>

          {previewArticle && (
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-6">
              <article className="space-y-6">
                {previewArticle.imageUrl && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={previewArticle.imageUrl}
                      alt={previewArticle.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold leading-tight">
                      {previewArticle.title}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center rounded-full border border-border/70 bg-muted px-3 py-1 font-medium">
                      {previewArticle.source}
                    </span>
                  </div>

                  {previewArticle.excerpt && (
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold">الملخص</h2>
                      <p className="leading-relaxed text-muted-foreground">
                        {previewArticle.excerpt}
                      </p>
                    </div>
                  )}

                  {previewArticle.content && (
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold">المحتوى</h2>
                      <ArticleTiptapReadOnly body={previewArticle.content} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold">الرابط الأصلي</h2>
                    <a
                      href={previewArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block break-all text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {previewArticle.url}
                    </a>
                  </div>
                </div>
              </article>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
