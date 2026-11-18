"use client"

import { Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { AdminCategoryModals } from "@/components/admin-category-modals"
import { AdminCategorySelect } from "@/components/admin-category-select"
import { ArticleCoverField } from "@/components/article-cover-field"
import type { Editor } from "@tiptap/core"
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
import {
  buildArticleSnapshot,
  normalizeArticleBodyJson,
  type ArticleFields,
} from "@/lib/article-snapshot"
import { createDirtyDebouncer } from "@/lib/editor-debounce"
import {
  classifyDraft,
  clearDraft,
  readDraft,
  writeDraft,
  type ArticleDraft,
} from "@/lib/editor-draft"
import { internalNavTarget } from "@/lib/editor-nav-guard"
import {
  createSaveController,
  type SaveResult,
  type SaveStatus,
} from "@/lib/editor-save-controller"
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
  /** Server `updatedAt` (ISO string or ms) for the loaded row; enables conflict detection + draft staleness. */
  initialUpdatedAt?: string | number | null
}

const AUTOSAVE_DEBOUNCE_MS = 1500
const DRAFT_DEBOUNCE_MS = 800
const SAVED_LABEL_HIDE_MS = 2500

function toMs(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === "number" ? value : Date.parse(value)
  return Number.isFinite(n) ? n : null
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
  initialUpdatedAt,
}: Props) {
  const router = useRouter()
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
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [editCategoryOpen, setEditCategoryOpen] = useState(false)
  const [isPublished, setIsPublished] = useState(initialIsPublished)
  const [isMemberOnly, setIsMemberOnly] = useState(initialIsMemberOnly)
  const [infoOpen, setInfoOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [draftOffer, setDraftOffer] = useState<{
    draft: ArticleDraft
    kind: "restore" | "stale"
  } | null>(null)

  // The editor body is NOT React state (typing must not re-render this form); it is read from the
  // editor only when a save / draft write actually happens.
  const editorRef = useRef<Editor | null>(null)
  const fieldsRef = useRef({ title, excerpt, categoryIds, isPublished, isMemberOnly })
  const updatedAtRef = useRef<string | number | null>(initialUpdatedAt ?? null)
  const savedLabelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const readFields = useCallback((): ArticleFields => {
    const f = fieldsRef.current
    const editor = editorRef.current
    return {
      title: f.title,
      excerpt: f.excerpt,
      categoryIds: Array.from(f.categoryIds).sort(),
      isPublished: f.isPublished,
      isMemberOnly: f.isMemberOnly,
      bodyJson:
        editor && !editor.isDestroyed
          ? JSON.stringify(editor.getJSON())
          : initialNormalizedBodyJson,
    }
  }, [initialNormalizedBodyJson])

  const [controller] = useState(() =>
    createSaveController<ArticleFields>({
      getValue: readFields,
      serialize: buildArticleSnapshot,
      initialSnapshot: buildArticleSnapshot({
        title: initialTitle,
        excerpt: initialExcerpt,
        categoryIds: initialCategoryIds,
        isPublished: initialIsPublished,
        isMemberOnly: initialIsMemberOnly,
        bodyJson: initialNormalizedBodyJson,
      }),
      debounceMs: AUTOSAVE_DEBOUNCE_MS,
      onStatus: (status, error) => {
        setSaveStatus(status)
        setSaveError(error)
      },
      onBeforeSave: (value) => {
        writeDraft(articleId, { ...value, baseUpdatedAt: toMs(updatedAtRef.current) })
      },
      onSaved: ({ stillDirty }) => {
        if (!stillDirty) clearDraft(articleId)
      },
      save: async (value): Promise<SaveResult> => {
        // `expectedUpdatedAt` is the optimistic-concurrency token. The server action must accept it
        // (see documentation/09-editor-notes.md); until it does it is simply ignored.
        const input = {
          id: articleId,
          title: value.title,
          excerpt: value.excerpt,
          bodyJson: value.bodyJson,
          categoryIds: value.categoryIds,
          isPublished: value.isPublished,
          isMemberOnly: value.isMemberOnly,
          expectedUpdatedAt: updatedAtRef.current,
        }
        const result = (await updateArticleAction(
          input as Parameters<typeof updateArticleAction>[0],
        )) as { ok: boolean; error?: string; code?: string; updatedAt?: string | number }
        if (result.ok) {
          if (result.updatedAt !== undefined) updatedAtRef.current = result.updatedAt
          return { ok: true }
        }
        const error = result.error ?? "تعذر حفظ المقال."
        if (result.code === "conflict") return { ok: false, error, conflict: true }
        // Validation failures will not succeed on retry; wait for the next edit instead.
        return { ok: false, error, retryable: false }
      },
    }),
  )

  const draftWriter = useMemo(
    () =>
      createDirtyDebouncer(() => {
        writeDraft(articleId, {
          ...readFields(),
          baseUpdatedAt: toMs(updatedAtRef.current),
        })
      }, DRAFT_DEBOUNCE_MS),
    [articleId, readFields],
  )

  const markDirty = useCallback(() => {
    controller.markDirty()
    draftWriter.markDirty()
  }, [controller, draftWriter])

  // Metadata fields: keep the ref current and mark dirty on change (skip the initial mount).
  const fieldsMountedRef = useRef(false)
  useEffect(() => {
    fieldsRef.current = { title, excerpt, categoryIds, isPublished, isMemberOnly }
    if (!fieldsMountedRef.current) {
      fieldsMountedRef.current = true
      return
    }
    markDirty()
  }, [title, excerpt, categoryIds, isPublished, isMemberOnly, markDirty])

  // Offer to restore an unsaved local draft (tab crashed / navigation cancelled the last save).
  useEffect(() => {
    const draft = readDraft(articleId)
    if (!draft) return
    const serverSnapshot = buildArticleSnapshot({
      title: initialTitle,
      excerpt: initialExcerpt,
      categoryIds: initialCategoryIds,
      isPublished: initialIsPublished,
      isMemberOnly: initialIsMemberOnly,
      bodyJson: initialNormalizedBodyJson,
    })
    const kind = classifyDraft(
      draft,
      serverSnapshot,
      buildArticleSnapshot(draft),
      toMs(initialUpdatedAt),
    )
    if (kind === "none") {
      clearDraft(articleId)
      return
    }
    setDraftOffer({ draft, kind })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per article
  }, [articleId])

  const restoreDraft = useCallback(() => {
    if (!draftOffer) return
    const { draft } = draftOffer
    setDraftOffer(null)
    setTitle(draft.title)
    setExcerpt(draft.excerpt)
    setCategoryIds(new Set(draft.categoryIds))
    setIsPublished(draft.isPublished)
    setIsMemberOnly(draft.isMemberOnly)
    try {
      editorRef.current?.commands.setContent(JSON.parse(draft.bodyJson), {
        emitUpdate: true,
      })
    } catch {
      clearDraft(articleId)
    }
    markDirty()
  }, [articleId, draftOffer, markDirty])

  const discardDraft = useCallback(() => {
    clearDraft(articleId)
    setDraftOffer(null)
  }, [articleId])

  // Flush paths. A server action started while the page is going away is usually cancelled, so the
  // synchronous localStorage draft is the real safety net; the save is best effort on top.
  useEffect(() => {
    const flushNow = () => {
      draftWriter.flush()
      void controller.flush()
    }
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushNow()
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!controller.hasUnsaved()) return
      draftWriter.flush()
      event.preventDefault()
      event.returnValue = ""
    }
    const onOnline = () => {
      if (controller.hasUnsaved()) void controller.flush()
    }
    const onClickCapture = (event: MouseEvent) => {
      if (!controller.hasUnsaved()) return
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null
      if (!anchor) return
      const target = internalNavTarget(
        {
          href: anchor.href,
          target: anchor.target,
          hasDownload: anchor.hasAttribute("download"),
        },
        event,
        window.location.href,
      )
      if (!target) return
      event.preventDefault()
      event.stopPropagation()
      draftWriter.flush()
      void controller.flush().then((ok) => {
        if (
          ok ||
          window.confirm("لم يتم حفظ بعض التغييرات بعد. هل تريد المغادرة رغم ذلك؟ (نسخة محلية محفوظة في هذا المتصفح)")
        ) {
          router.push(target)
        }
      })
    }

    window.addEventListener("pagehide", flushNow)
    window.addEventListener("popstate", flushNow)
    window.addEventListener("beforeunload", onBeforeUnload)
    window.addEventListener("online", onOnline)
    document.addEventListener("visibilitychange", onVisibility)
    document.addEventListener("click", onClickCapture, true)
    return () => {
      window.removeEventListener("pagehide", flushNow)
      window.removeEventListener("popstate", flushNow)
      window.removeEventListener("beforeunload", onBeforeUnload)
      window.removeEventListener("online", onOnline)
      document.removeEventListener("visibilitychange", onVisibility)
      document.removeEventListener("click", onClickCapture, true)
      // Unmount (in-app navigation that bypassed the click guard): same best effort.
      flushNow()
    }
  }, [controller, draftWriter, router])

  // "Saved" label disappears after a moment; other statuses stay visible.
  const [savedVisible, setSavedVisible] = useState(false)
  useEffect(() => {
    if (saveStatus !== "saved") {
      setSavedVisible(false)
      return
    }
    setSavedVisible(true)
    savedLabelTimeoutRef.current = setTimeout(() => setSavedVisible(false), SAVED_LABEL_HIDE_MS)
    return () => {
      if (savedLabelTimeoutRef.current) clearTimeout(savedLabelTimeoutRef.current)
    }
  }, [saveStatus])

  const autosaveLabel =
    saveStatus === "pending"
      ? "جارٍ الحفظ تلقائياً…"
      : saveStatus === "saving"
        ? ar.adminArticleSaving
        : saveStatus === "saved" && savedVisible
          ? ar.adminArticleUpdated
          : saveStatus === "error"
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

      {draftOffer ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
          role="alert"
          dir="rtl"
        >
          <span>
            {draftOffer.kind === "stale"
              ? "وُجدت نسخة محلية غير محفوظة، لكن المقال حُفظ من مكان آخر بعدها. استعادتها ستستبدل النسخة الأحدث عند الحفظ."
              : "وُجدت نسخة محلية غير محفوظة من هذا المقال."}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={restoreDraft}>
            استعادة
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={discardDraft}>
            تجاهل
          </Button>
        </div>
      ) : null}

      {saveStatus === "conflict" ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
          role="alert"
          dir="rtl"
        >
          <span>
            تم تعديل هذا المقال من نافذة أخرى. أُوقف الحفظ التلقائي حتى لا تُفقد التعديلات؛ انسخ عملك
            ثم أعد تحميل الصفحة.
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => window.location.reload()}>
            إعادة التحميل
          </Button>
        </div>
      ) : null}

      {autosaveLabel ? (
        <div
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs text-muted-foreground shadow-sm"
          role="status"
          aria-live="polite"
        >
          <span>{autosaveLabel}</span>
          {saveStatus === "error" ? (
            <button type="button" className="underline" onClick={() => void controller.flush()}>
              إعادة المحاولة
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 w-full min-w-0">
        <div className="relative min-h-0 min-w-0 flex-1 overflow-visible">
          <div className="flex h-full min-h-0 flex-col bg-background/95">
            <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
              <SheetContent side="right" className="w-[22rem] sm:w-[24rem]">
                <div className="flex h-full min-h-0 flex-col px-5 py-6">
                  <SheetHeader className="px-0 pt-0 pr-8 text-right">
                    <SheetTitle>معلومات المقال</SheetTitle>
                    <SheetDescription>
                      العنوان والملخص والأقسام وحالة النشر.
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
                  onEditorReady={(editor) => {
                    editorRef.current = editor
                  }}
                  onDirty={markDirty}
                  toolbarActions={
                    <>
                      <TiptapButton
                        type="button"
                        variant="ghost"
                        tooltip="معلومات المقال"
                        aria-label="معلومات المقال"
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


