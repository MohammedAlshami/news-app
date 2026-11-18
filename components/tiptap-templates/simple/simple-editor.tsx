"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"
import type { ReactNode } from "react"
import { Ai } from "@tiptap-pro/extension-ai"

import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node (styles; extensions from lib/tiptap-article-extensions) ---
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { LinkPopover, LinkButton } from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"
import { SlashDropdownMenu } from "@/components/tiptap-ui/slash-dropdown-menu"
import { DragContextMenu } from "@/components/tiptap-ui/drag-context-menu"
import { AiMenu } from "@/components/tiptap-ui/ai-menu"
import { AiPromptDock } from "@/components/tiptap-ui/ai-prompt-dock"
import { NotionToolbarFloating } from "@/components/tiptap-templates/notion-like/notion-like-editor-toolbar-floating"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"

// --- Lib ---
import { getArticleTiptapExtensions } from "@/lib/tiptap-article-extensions"
import { cn } from "@/lib/utils"
import { createDirtyDebouncer } from "@/lib/editor-debounce"
import {
  AI_EMPTY_MESSAGE,
  AI_TRUNCATED_MESSAGE,
  aiErrorMessage,
  isAbortError,
} from "@/lib/ai-stream"
import {
  createEditorOpenCodeCompletionResolver,
  createEditorOpenCodeStreamResolver,
} from "@/lib/editor-inline-opencode"
import type { SlashMenuConfig } from "@/components/tiptap-ui/use-slash-dropdown-menu"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import type { Editor } from "@tiptap/core"
import { tiptapEmptyDocument } from "@/lib/tiptap-empty-doc"

/** Empty Tiptap doc; use for “new article” instead of the demo. */
export const simpleEditorEmptyDocument = tiptapEmptyDocument

const MainToolbarContent = ({
  onLinkClick,
  isMobile,
  toolbarActions,
}: {
  onLinkClick: () => void
  isMobile: boolean
  toolbarActions?: ReactNode
}) => {
  return (
    <>
      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="underline" />
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
        {toolbarActions}
      </ToolbarGroup>

      <Spacer />
    </>
  )
}

const slashMenuConfig = {
  enabledItems: [
    "continue_writing",
    "ai_ask_button",
    "text",
    "heading_1",
    "heading_2",
    "heading_3",
    "bullet_list",
    "ordered_list",
    "quote",
    "mention",
    "emoji",
    "table",
    "divider",
    "toc",
    "image",
  ],
  itemGroups: {
    continue_writing: "الذكاء الاصطناعي",
    ai_ask_button: "الذكاء الاصطناعي",
    text: "تنسيق",
    heading_1: "تنسيق",
    heading_2: "تنسيق",
    heading_3: "تنسيق",
    bullet_list: "تنسيق",
    ordered_list: "تنسيق",
    quote: "تنسيق",
    mention: "إدراج",
    emoji: "إدراج",
    table: "إدراج",
    divider: "إدراج",
    toc: "إدراج",
    image: "رفع",
  },
  showGroups: true,
} as SlashMenuConfig

/** Trailing debounce for `onContentChange` (JSON serialisation is O(document)). */
const CONTENT_CHANGE_DEBOUNCE_MS = 400

type Notice = { message: string; kind: "error" | "info" | "warn" }

type SimpleEditorProps = {
  /** Tiptap JSON used ONCE when the editor is created (changing it later does not reset the editor). */
  initialDocument?: Record<string, unknown>
  /** Called when the editor instance is ready. Use for saving text/HTML from the parent. */
  onEditorReady?: (editor: Editor) => void
  /** Cheap (O(1)) signal fired on every document-changing transaction. */
  onDirty?: () => void
  /** Trailing-debounced (400ms) full JSON; also flushed on blur. Do not use for per-keystroke work. */
  onContentChange?: (json: Record<string, unknown>) => void
  /**
   * Use in admin forms/cards. Disables the template’s `100vw` / `100vh` wrapper so the
   * editor stays within its parent (fixes RTL overflow and empty space on the side).
   */
  embedded?: boolean
  /** When set (e.g. admin article editor), inline images upload to R2 / local storage for this article. */
  articleId?: string
  /** Additional controls rendered in the top toolbar. */
  toolbarActions?: ReactNode
  /** Extra className applied to the toolbar container. */
  toolbarClassName?: string
}

export function SimpleEditor({
  initialDocument,
  onEditorReady,
  onDirty,
  onContentChange,
  embedded = false,
  articleId,
  toolbarActions,
  toolbarClassName,
}: SimpleEditorProps = {}) {
  const isMobile = useIsBreakpoint()
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Content is applied only when the editor is created; later prop changes must not rebuild it.
  const initialDocRef = useRef(
    (initialDocument ?? simpleEditorEmptyDocument) as Record<string, unknown>,
  )

  // Keep parent callbacks fresh without recreating the editor.
  const onEditorReadyRef = useRef(onEditorReady)
  const onDirtyRef = useRef(onDirty)
  const onContentChangeRef = useRef(onContentChange)
  useEffect(() => {
    onEditorReadyRef.current = onEditorReady
    onDirtyRef.current = onDirty
    onContentChangeRef.current = onContentChange
  })

  const showNotice = useCallback((message: string, kind: Notice["kind"] = "error") => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
    noticeTimerRef.current = null
    if (!message) {
      setNotice(null)
      return
    }
    setNotice({ message, kind })
    if (kind !== "error") {
      noticeTimerRef.current = setTimeout(() => setNotice(null), 6000)
    }
  }, [])
  const showNoticeRef = useRef(showNotice)
  useEffect(() => {
    showNoticeRef.current = showNotice
  }, [showNotice])
  useEffect(
    () => () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
    },
    [],
  )

  const extensions = useMemo(
    () =>
      [
        ...getArticleTiptapExtensions({
          linkOpenOnClick: false,
          articleId,
          onNotify: (message, kind) => showNoticeRef.current(message, kind),
        }),
        // Text generation goes through our own /api/ai resolvers, so the Tiptap Cloud appId/token
        // are not needed (and must not ship in the client bundle).
        Ai.configure({
          autocompletion: false,
          showDecorations: true,
          hideDecorationsOnStreamEnd: false,
          aiStreamResolver: createEditorOpenCodeStreamResolver({
            onThinking: () => showNoticeRef.current("الذكاء الاصطناعي يفكّر…", "info"),
            onTruncated: () => showNoticeRef.current(AI_TRUNCATED_MESSAGE, "warn"),
          }),
          aiCompletionResolver: createEditorOpenCodeCompletionResolver({
            onTruncated: () => showNoticeRef.current(AI_TRUNCATED_MESSAGE, "warn"),
          }),
          onLoading: (context) => {
            if (!context.editor) return
            try { context.editor.commands.aiGenerationSetIsLoading(true) } catch {}
            try { context.editor.commands.aiGenerationHasMessage(false) } catch {}
          },
          onChunk: (context) => {
            if (!context.editor) return
            try { context.editor.commands.aiGenerationSetIsLoading(true) } catch {}
            try { context.editor.commands.aiGenerationHasMessage(true) } catch {}
          },
          // Single accept path (the old duplicate effect-based accept was dead code).
          onSuccess: (context) => {
            if (!context.editor) return
            const hasMessage = !!context.response?.trim()
            try { context.editor.commands.aiGenerationSetIsLoading(false) } catch {}
            try { context.editor.commands.aiGenerationHasMessage(hasMessage) } catch {}
            if (hasMessage) {
              try { context.editor.chain().aiAccept().run() } catch {}
              try { context.editor.commands.resetUiState() } catch {}
            } else {
              showNoticeRef.current(AI_EMPTY_MESSAGE, "error")
              try { context.editor.commands.resetUiState() } catch {}
            }
          },
          onError: (error, context) => {
            const editor = context?.editor
            if (editor && !editor.isDestroyed) {
              try { editor.commands.aiGenerationSetIsLoading(false) } catch {}
              try { editor.commands.aiGenerationHasMessage(false) } catch {}
              try { editor.commands.resetUiState() } catch {}
            }
            // User cancelled (Esc / closed the menu): not an error.
            if (isAbortError(error)) return
            showNoticeRef.current(aiErrorMessage(error), "error")
          },
        }),
      ],
    [articleId],
  )

  const editor = useEditor(
    {
      immediatelyRender: false,
      editorProps: {
        attributes: {
          autocomplete: "off",
          autocorrect: "off",
          autocapitalize: "off",
          "aria-label": "محرر نص المقال",
          class: "simple-editor",
          // Default direction for empty/neutral content; blocks follow their own text (dir=auto
          // decorations, see lib/tiptap-article-rtl).
          dir: "rtl",
          lang: "ar",
        },
      },
      onCreate: ({ editor: e }) => {
        onEditorReadyRef.current?.(e)
      },
      onUpdate: ({ transaction }) => {
        if (!transaction.docChanged) return
        onDirtyRef.current?.()
        debouncerRef.current?.markDirty()
      },
      onBlur: () => debouncerRef.current?.flush(),
      extensions,
      content: initialDocRef.current,
    },
    [articleId],
  )

  const debouncerRef = useRef<ReturnType<typeof createDirtyDebouncer> | null>(null)
  useEffect(() => {
    if (!editor) return
    const d = createDirtyDebouncer(() => {
      if (editor.isDestroyed) return
      onContentChangeRef.current?.(editor.getJSON() as Record<string, unknown>)
    }, CONTENT_CHANGE_DEBOUNCE_MS)
    debouncerRef.current = d
    return () => {
      d.flush()
      debouncerRef.current = null
    }
  }, [editor])

  return (
    <div
      className={cn(
        "simple-editor-wrapper relative",
        embedded && "simple-editor-wrapper--embedded",
      )}
    >
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          className={toolbarClassName}
        >
          <div className="flex w-full items-center pt-2">
            <MainToolbarContent
              onLinkClick={() => {}}
              isMobile={isMobile}
              toolbarActions={toolbarActions}
            />
          </div>
        </Toolbar>

        {notice ? (
          <div
            role={notice.kind === "error" ? "alert" : "status"}
            dir="rtl"
            className={cn(
              "simple-editor-notice sticky top-14 z-40 mx-auto my-2 flex w-fit max-w-[90%] items-center gap-3 rounded-lg border px-3 py-2 text-sm shadow-sm",
              notice.kind === "error" && "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
              notice.kind === "warn" && "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
              notice.kind === "info" && "border-border bg-card/90 text-muted-foreground",
            )}
          >
            <span>{notice.message}</span>
            <button
              type="button"
              className="text-xs underline"
              onClick={() => setNotice(null)}
            >
              إغلاق
            </button>
          </div>
        ) : null}

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
        <AiMenu />
        <AiPromptDock editor={editor} articleId={articleId} />
        <SlashDropdownMenu config={slashMenuConfig} />
        <DragContextMenu />
        <NotionToolbarFloating />
      </EditorContext.Provider>
    </div>
  )
}
