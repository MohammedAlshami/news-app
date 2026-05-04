"use client"

import type { Editor } from "@tiptap/core"
import { Info } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { updateArticleAction } from "@/app/admin/articles/actions"
import { AdminCategoryModals } from "@/components/admin-category-modals"
import { AdminCategorySelect } from "@/components/admin-category-select"
import { ArticleCoverField } from "@/components/article-cover-field"
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { SiteCategory } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"

type Props = {
  categories: SiteCategory[]
  articleId: string
  initialCoverImageUrl: string | null
  initialTitle: string
  initialExcerpt: string
  initialDocument: Record<string, unknown>
  initialCategoryIds: string[]
  initialIsPublished: boolean
}

function ArticleInfoSheet({
  categories,
  articleId,
  initialCoverImageUrl,
  title,
  setTitle,
  excerpt,
  setExcerpt,
  isPublished,
  setIsPublished,
  categoryIds,
  setCategoryIds,
  addCategoryOpen,
  setAddCategoryOpen,
  editCategoryOpen,
  setEditCategoryOpen,
}: {
  categories: SiteCategory[]
  articleId: string
  initialCoverImageUrl: string | null
  title: string
  setTitle: (value: string) => void
  excerpt: string
  setExcerpt: (value: string) => void
  isPublished: boolean
  setIsPublished: (value: boolean) => void
  categoryIds: Set<string>
  setCategoryIds: (value: Set<string>) => void
  addCategoryOpen: boolean
  setAddCategoryOpen: (value: boolean) => void
  editCategoryOpen: boolean
  setEditCategoryOpen: (value: boolean) => void
}) {
  return (
    <div className="space-y-5 pb-2">
      <ArticleCoverField
        articleId={articleId}
        initialUrl={initialCoverImageUrl}
        className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm"
      />

      <div className="space-y-2">
        <Label htmlFor="article-title">{ar.adminArticleFieldTitle}</Label>
        <Input
          id="article-title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="article-excerpt">{ar.adminArticleFieldExcerpt}</Label>
        <Textarea
          id="article-excerpt"
          name="excerpt"
          rows={4}
          dir="rtl"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/80 p-4 shadow-sm" dir="rtl">
        <div className="space-y-0.5">
          <Label htmlFor="article-published" className="text-sm font-medium">
            {ar.adminArticlePublishToggle}
          </Label>
          <p className="text-xs text-muted-foreground">{ar.adminArticlePublishHint}</p>
        </div>
        <Switch
          id="article-published"
          checked={isPublished}
          onCheckedChange={setIsPublished}
          aria-label={ar.adminArticlePublishToggle}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3" dir="rtl">
          <p className="text-sm font-medium leading-none" id="admin-article-categories">
            {ar.adminArticleFieldCategories}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddCategoryOpen(true)}>
              {ar.adminCategoryAddButton}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={categories.length === 0}
              onClick={() => setEditCategoryOpen(true)}
            >
              {ar.adminCategoryEditButton}
            </Button>
          </div>
        </div>

        <AdminCategoryModals
          categories={categories}
          addOpen={addCategoryOpen}
          onAddOpenChange={setAddCategoryOpen}
          editOpen={editCategoryOpen}
          onEditOpenChange={setEditCategoryOpen}
        />

        <AdminCategorySelect
          categories={categories}
          selectedIds={categoryIds}
          onChange={setCategoryIds}
          aria-labelledby="admin-article-categories"
        />
      </div>
    </div>
  )
}

export function CreateArticleForm({
  categories,
  articleId,
  initialCoverImageUrl,
  initialTitle,
  initialExcerpt,
  initialDocument,
  initialCategoryIds,
  initialIsPublished,
}: Props) {
  const [title, setTitle] = useState(initialTitle)
  const [excerpt, setExcerpt] = useState(initialExcerpt)
  const [categoryIds, setCategoryIds] = useState<Set<string>>(() => {
    if (initialCategoryIds.length > 0) return new Set(initialCategoryIds)
    return new Set()
  })
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [editCategoryOpen, setEditCategoryOpen] = useState(false)
  const [isPublished, setIsPublished] = useState(initialIsPublished)
  const [infoOpen, setInfoOpen] = useState(false)
  const [editorDocument, setEditorDocument] = useState<Record<string, unknown>>(initialDocument)
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorTitle, setErrorTitle] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const editorRef = useRef<Editor | null>(null)
  const debounceRef = useRef<number | null>(null)
  const isHydratedRef = useRef(false)
  const dirtyRef = useRef(false)
  const lastSavedSignatureRef = useRef(
    JSON.stringify({
      title: initialTitle,
      excerpt: initialExcerpt,
      isPublished: initialIsPublished,
      categoryIds: [...initialCategoryIds].sort(),
      document: initialDocument,
    }),
  )

  useEffect(() => {
    const nextSignature = JSON.stringify({
      title,
      excerpt,
      isPublished,
      categoryIds: [...categoryIds].sort(),
      document: editorDocument,
    })

    if (!dirtyRef.current || nextSignature === lastSavedSignatureRef.current) {
      return
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(async () => {
      const result = await updateArticleAction({
        id: articleId,
        title,
        excerpt,
        bodyJson: JSON.stringify(editorDocument),
        categoryIds: [...categoryIds],
        isPublished,
      })

      if (result.ok === false) {
        setErrorTitle("تعذر الحفظ")
        setErrorMessage(result.error)
        setErrorModalOpen(true)
        return
      }

      lastSavedSignatureRef.current = nextSignature
      dirtyRef.current = false
    }, 900)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [
    articleId,
    categoryIds,
    excerpt,
    initialCategoryIds,
    initialDocument,
    initialExcerpt,
    initialIsPublished,
    editorDocument,
    isPublished,
    title,
  ])

  return (
    <form className="min-h-[calc(100svh-9rem)] space-y-6" onSubmit={(e) => e.preventDefault()}>
      {categories.length === 0 ? (
        <p className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100" role="status">
          {ar.adminArticleNoCategoriesBanner}
        </p>
      ) : null}

      <div className="flex min-h-[calc(100svh-15rem)] w-full min-w-0">
        <div className="relative min-h-[70vh] min-w-0 flex-1 overflow-visible">
          <SimpleEditor
            embedded
            key={articleId}
            articleId={articleId}
            initialDocument={initialDocument}
            onEditorReady={(ed) => {
              editorRef.current = ed
            }}
            onContentChange={(json) => {
              setEditorDocument(json)
              if (isHydratedRef.current) {
                dirtyRef.current = true
              } else {
                isHydratedRef.current = true
              }
            }}
            toolbarActions={
              <div className="flex items-center gap-3">
                <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-border/70 px-3 shadow-sm"
                      aria-label="معلومات المقال"
                      title="معلومات المقال"
                    >
                      <Info className="size-4" />
                      <span className="sr-only">معلومات المقال</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[22rem] sm:w-[24rem]">
                    <div className="flex h-full min-h-0 flex-col px-5 py-6">
                      <SheetHeader className="px-0 pt-0">
                      <SheetTitle>معلومات المقال</SheetTitle>
                      <SheetDescription>
                        العنوان، الملخص، الأقسام، وحالة النشر.
                      </SheetDescription>
                      </SheetHeader>
                      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                        <ArticleInfoSheet
                          categories={categories}
                          articleId={articleId}
                          initialCoverImageUrl={initialCoverImageUrl}
                          title={title}
                          setTitle={setTitle}
                          excerpt={excerpt}
                          setExcerpt={setExcerpt}
                          isPublished={isPublished}
                          setIsPublished={setIsPublished}
                          categoryIds={categoryIds}
                          setCategoryIds={setCategoryIds}
                          addCategoryOpen={addCategoryOpen}
                          setAddCategoryOpen={setAddCategoryOpen}
                          editCategoryOpen={editCategoryOpen}
                          setEditCategoryOpen={setEditCategoryOpen}
                        />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            }
            toolbarClassName="sticky top-2 z-30 mx-auto w-full max-w-none rounded-3xl border border-border/70 bg-background/95 px-3 py-3 shadow-lg backdrop-blur"
          />
        </div>
      </div>

      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{errorTitle || "خطأ"}</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </form>
  )
}
