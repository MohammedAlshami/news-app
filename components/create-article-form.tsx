"use client"

import { Info } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { AdminCategoryModals } from "@/components/admin-category-modals"
import { AdminCategorySelect } from "@/components/admin-category-select"
import { ArticleCoverField } from "@/components/article-cover-field"
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
import { updateArticleAction } from "@/app/admin/articles/actions"
import type { SiteCategory } from "@/lib/site-types"
import { tiptapEmptyDocument } from "@/lib/tiptap-empty-doc"
import { ar } from "@/lib/ui-ar"

type Props = {
  categories: SiteCategory[]
  articleId: string
  initialCoverImageUrl: string | null
  initialTitle: string
  initialExcerpt: string
  initialCategoryIds: string[]
  initialIsPublished: boolean
  initialIsMemberOnly: boolean
  initialBodyJson: string
}

type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error"

const AUTOSAVE_DEBOUNCE_MS = 1500
const SAVED_LABEL_HIDE_MS = 2500

function normalizeArticleBodyJson(bodyJson: string | null | undefined) {
  const fallback = JSON.stringify(tiptapEmptyDocument)
  const trimmed = bodyJson?.trim() ?? ""
  if (!trimmed) return fallback

  try {
    const parsed = JSON.parse(trimmed) as { type?: string }
    return parsed?.type === "doc" ? trimmed : fallback
  } catch {
    return fallback
  }
}

function buildArticleSnapshot(input: {
  title: string
  excerpt: string
  categoryIds: Set<string>
  isPublished: boolean
  isMemberOnly: boolean
  bodyJson: string
}) {
  return JSON.stringify({
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    categoryIds: Array.from(input.categoryIds).sort(),
    isPublished: input.isPublished,
    isMemberOnly: input.isMemberOnly,
    bodyJson: normalizeArticleBodyJson(input.bodyJson),
  })
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
  isMemberOnly,
  setIsMemberOnly,
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
  isMemberOnly: boolean
  setIsMemberOnly: (value: boolean) => void
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
          <p className="text-xs text-muted-foreground">
            {ar.adminArticlePublishHint}
          </p>
        </div>
        <Switch
          id="article-published"
          checked={isPublished}
          onCheckedChange={setIsPublished}
          aria-label={ar.adminArticlePublishToggle}
        />
      </div>

      <div
        className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/80 p-4 shadow-sm"
        dir="rtl"
      >
        <div className="space-y-0.5">
          <Label htmlFor="article-member-only" className="text-sm font-medium">
            {ar.adminArticleMemberOnlyToggle}
          </Label>
          <p className="text-xs text-muted-foreground">
            {ar.adminArticleMemberOnlyHint}
          </p>
        </div>
        <Switch
          id="article-member-only"
          checked={isMemberOnly}
          onCheckedChange={setIsMemberOnly}
          aria-label={ar.adminArticleMemberOnlyToggle}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3" dir="rtl">
          <p
            className="text-sm font-medium leading-none"
            id="admin-article-categories"
          >
            {ar.adminArticleFieldCategories}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddCategoryOpen(true)}
            >
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
  initialIsMemberOnly,
  initialBodyJson,
}: Props) {
  const [title, setTitle] = useState(initialTitle)
  const [excerpt, setExcerpt] = useState(initialExcerpt)
  const [categoryIds, setCategoryIds] = useState<Set<string>>(
    () => new Set(initialCategoryIds),
  )
  const initialNormalizedBodyJson = useMemo(
    () => normalizeArticleBodyJson(initialBodyJson),
    [initialBodyJson],
  )
  const initialDocument = useMemo(() => {
    try {
      return JSON.parse(initialNormalizedBodyJson) as Record<string, unknown>
    } catch {
      return tiptapEmptyDocument as Record<string, unknown>
    }
  }, [initialNormalizedBodyJson])
  const [bodyJson, setBodyJson] = useState(initialNormalizedBodyJson)
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [editCategoryOpen, setEditCategoryOpen] = useState(false)
  const [isPublished, setIsPublished] = useState(initialIsPublished)
  const [isMemberOnly, setIsMemberOnly] = useState(initialIsMemberOnly)
  const [infoOpen, setInfoOpen] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle")
  const [saveError, setSaveError] = useState<string | null>(null)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedLabelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveInFlightRef = useRef(false)
  const pendingSaveAfterFlightRef = useRef(false)
  const performSaveRef = useRef<(() => Promise<void>) | null>(null)
  const lastSavedSnapshotRef = useRef(
    buildArticleSnapshot({
      title: initialTitle,
      excerpt: initialExcerpt,
      categoryIds: new Set(initialCategoryIds),
      isPublished: initialIsPublished,
      isMemberOnly: initialIsMemberOnly,
      bodyJson: initialNormalizedBodyJson,
    }),
  )
  const latestStateRef = useRef({
    title: initialTitle,
    excerpt: initialExcerpt,
    categoryIds: new Set(initialCategoryIds),
    isPublished: initialIsPublished,
    isMemberOnly: initialIsMemberOnly,
    bodyJson: initialNormalizedBodyJson,
  })

  const clearSavedLabelTimeout = useCallback(() => {
    if (savedLabelTimeoutRef.current) {
      clearTimeout(savedLabelTimeoutRef.current)
      savedLabelTimeoutRef.current = null
    }
  }, [])

  const showSavedLabel = useCallback(() => {
    setAutosaveStatus("saved")
    clearSavedLabelTimeout()
    savedLabelTimeoutRef.current = setTimeout(() => {
      setAutosaveStatus("idle")
      savedLabelTimeoutRef.current = null
    }, SAVED_LABEL_HIDE_MS)
  }, [clearSavedLabelTimeout])

  const performSave = useCallback(async () => {
    const current = latestStateRef.current
    const snapshot = buildArticleSnapshot(current)

    if (snapshot === lastSavedSnapshotRef.current) {
      setSaveError(null)
      showSavedLabel()
      return
    }

    if (saveInFlightRef.current) {
      pendingSaveAfterFlightRef.current = true
      return
    }

    saveInFlightRef.current = true
    setSaveError(null)
    setAutosaveStatus("saving")

    try {
      const result = await updateArticleAction({
        id: articleId,
        title: current.title,
        excerpt: current.excerpt,
        bodyJson: current.bodyJson,
        categoryIds: Array.from(current.categoryIds).sort(),
        isPublished: current.isPublished,
        isMemberOnly: current.isMemberOnly,
      })

      if (!result.ok) {
        setSaveError(result.error)
        setAutosaveStatus("error")
        return
      }

      lastSavedSnapshotRef.current = snapshot
      showSavedLabel()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "تعذر حفظ المقال.")
      setAutosaveStatus("error")
    } finally {
      saveInFlightRef.current = false
      if (pendingSaveAfterFlightRef.current) {
        pendingSaveAfterFlightRef.current = false
        window.setTimeout(() => {
          void performSaveRef.current?.()
        }, 0)
      }
    }
  }, [articleId, showSavedLabel])

  useEffect(() => {
    performSaveRef.current = performSave
  }, [performSave])

  const scheduleDebouncedSave = useCallback(() => {
    const snapshot = buildArticleSnapshot(latestStateRef.current)
    if (snapshot === lastSavedSnapshotRef.current) {
      setSaveError(null)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      if (!saveInFlightRef.current) {
        setAutosaveStatus("idle")
      }
      return
    }

    setAutosaveStatus((status) => (status === "saving" ? status : "pending"))
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null
      void performSaveRef.current?.()
    }, AUTOSAVE_DEBOUNCE_MS)
  }, [])

  useEffect(() => {
    latestStateRef.current = {
      title,
      excerpt,
      categoryIds: new Set(categoryIds),
      isPublished,
      isMemberOnly,
      bodyJson,
    }
    scheduleDebouncedSave()
  }, [bodyJson, categoryIds, excerpt, isMemberOnly, isPublished, scheduleDebouncedSave, title])

  useEffect(() => {
    const flushSave = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      void performSaveRef.current?.()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushSave()
      }
    }

    window.addEventListener("pagehide", flushSave)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("pagehide", flushSave)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [performSave])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      const snapshot = buildArticleSnapshot(latestStateRef.current)
      if (snapshot !== lastSavedSnapshotRef.current) {
        void performSaveRef.current?.()
      }
    }
  }, [])

  const autosaveLabel =
    autosaveStatus === "pending"
      ? "جارٍ الحفظ تلقائياً…"
      : autosaveStatus === "saving"
        ? ar.adminArticleSaving
        : autosaveStatus === "saved"
          ? ar.adminArticleUpdated
          : autosaveStatus === "error"
            ? saveError ?? "تعذر حفظ المقال."
            : null
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

      {autosaveLabel ? (
        <div
          className="rounded-2xl border border-border bg-card/70 px-4 py-2 text-xs text-muted-foreground shadow-sm"
          role="status"
          aria-live="polite"
        >
          {autosaveLabel}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 w-full min-w-0">
        <div className="relative min-h-0 min-w-0 flex-1 overflow-visible">
          <div className="flex h-full min-h-0 flex-col bg-background/95">
            <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
              <SheetContent side="right" className="w-[22rem] sm:w-[24rem]">
                <div className="flex h-full min-h-0 flex-col px-5 py-6">
                  <SheetHeader className="px-0 pt-0">
                    <SheetTitle>Article info</SheetTitle>
                    <SheetDescription>
                      Title, excerpt, categories, and publish state.
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
                      isMemberOnly={isMemberOnly}
                      setIsMemberOnly={setIsMemberOnly}
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

            <div className="flex min-h-0 flex-1">
              <div className="flex min-h-0 flex-1 flex-col gap-4">
                <SimpleEditor
                  embedded
                  articleId={articleId}
                  initialDocument={initialDocument}
                  onContentChange={(json) => {
                    setBodyJson(JSON.stringify(json))
                  }}
                  toolbarActions={
                    <>
                      <TiptapButton
                        type="button"
                        variant="ghost"
                        tooltip="Article info"
                        aria-label="Article info"
                        onClick={() => setInfoOpen(true)}
                      >
                        <Info
                          className="tiptap-button-icon"
                          strokeWidth={1.75}
                        />
                      </TiptapButton>
                    </>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


