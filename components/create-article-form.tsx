"use client"

import { Info, Sparkles } from "lucide-react"
import { useState } from "react"

import { AdminCategoryModals } from "@/components/admin-category-modals"
import { AdminCategorySelect } from "@/components/admin-category-select"
import { ArticleCoverField } from "@/components/article-cover-field"
import { AiMenuInputTextarea } from "@/components/tiptap-ui/ai-menu-input"
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import { Button } from "@/components/ui/button"
import { Button as TiptapButton } from "@/components/tiptap-ui-primitive/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { SiteCategory } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"
import type { Editor } from "@tiptap/core"

type Props = {
  categories: SiteCategory[]
  articleId: string
  initialCoverImageUrl: string | null
  initialTitle: string
  initialExcerpt: string
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

      <div
        className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/80 p-4 shadow-sm"
        dir="rtl"
      >
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
  initialCategoryIds,
  initialIsPublished,
}: Props) {
  const [title, setTitle] = useState(initialTitle)
  const [excerpt, setExcerpt] = useState(initialExcerpt)
  const [categoryIds, setCategoryIds] = useState<Set<string>>(() => new Set(initialCategoryIds))
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [editCategoryOpen, setEditCategoryOpen] = useState(false)
  const [isPublished, setIsPublished] = useState(initialIsPublished)
  const [infoOpen, setInfoOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiOutput, setAiOutput] = useState("")
  const [editor, setEditor] = useState<Editor | null>(null)

  async function handleAiSubmit(prompt: string) {
    if (!editor || !prompt.trim()) return
    setAiOpen(true)
    setAiLoading(true)
    setAiOutput("")

    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        articleId,
        title,
        excerpt,
        mode: "write",
      }),
    })

    if (!response.ok || !response.body) {
      setAiLoading(false)
      setAiOutput("Failed to generate text.")
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ""

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      fullText += chunk
      setAiOutput(fullText)
    }

    setAiLoading(false)
    if (fullText.trim()) {
      editor.chain().focus().insertContent(fullText).run()
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      {categories.length === 0 ? (
        <p
          className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
          role="status"
        >
          {ar.adminArticleNoCategoriesBanner}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 w-full min-w-0">
        <div className="relative min-h-0 min-w-0 flex-1 overflow-visible">
          <div className="flex h-full min-h-0 flex-col bg-background/95">
            <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
              <SheetContent side="right" className="w-[22rem] sm:w-[24rem]">
                <div className="flex h-full min-h-0 flex-col px-5 py-6">
                  <SheetHeader className="px-0 pt-0">
                    <SheetTitle>Article info</SheetTitle>
                    <SheetDescription>Title, excerpt, categories, and publish state.</SheetDescription>
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

            <Sheet open={aiOpen} onOpenChange={setAiOpen}>
              <SheetContent side="right" className="w-[22rem] sm:w-[28rem]">
                <div className="flex h-full min-h-0 flex-col px-5 py-6">
                  <SheetHeader className="px-0 pt-0">
                    <SheetTitle>الكتابة بالذكاء الاصطناعي</SheetTitle>
                    <SheetDescription>اكتب طلبك، ثم أدخل النص الناتج في المقال.</SheetDescription>
                  </SheetHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    <AiMenuInputTextarea
                      onInputSubmit={handleAiSubmit}
                      onPlaceholderClick={() => setAiOpen(true)}
                      placeholder="اكتب ما تريد أن يكتبه الذكاء الاصطناعي..."
                    />
                    <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-3 text-sm">
                      {aiLoading ? "جارٍ التوليد..." : aiOutput || "سيظهر النص هنا أثناء التوليد."}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setAiOpen(false)}>
                        إغلاق
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex min-h-0 flex-1">
              <SimpleEditor
                embedded
                articleId={articleId}
                onEditorReady={setEditor}
                onAiRequest={() => setAiOpen(true)}
                toolbarActions={
                  <>
                    <TiptapButton
                      type="button"
                      variant="ghost"
                      tooltip="اكتب باستخدام الذكاء الاصطناعي"
                      aria-label="اكتب باستخدام الذكاء الاصطناعي"
                      onClick={() => setAiOpen(true)}
                    >
                      <Sparkles className="tiptap-button-icon" strokeWidth={1.75} />
                    </TiptapButton>
                    <TiptapButton
                      type="button"
                      variant="ghost"
                      tooltip="Article info"
                      aria-label="Article info"
                      onClick={() => setInfoOpen(true)}
                    >
                      <Info className="tiptap-button-icon" strokeWidth={1.75} />
                    </TiptapButton>
                  </>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
