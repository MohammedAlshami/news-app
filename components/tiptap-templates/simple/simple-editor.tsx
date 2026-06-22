"use client"

import { useEffect, useMemo, useRef } from "react"
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
import { useUiEditorState } from "@/hooks/use-ui-editor-state"

// --- Lib ---
import { getArticleTiptapExtensions } from "@/lib/tiptap-article-extensions"
import { cn } from "@/lib/utils"
import { TIPTAP_AI_APP_ID, TIPTAP_AI_TOKEN } from "@/lib/tiptap-collab-utils"
import {
  createEditorOpenRouterCompletionResolver,
  createEditorOpenRouterStreamResolver,
} from "@/lib/editor-inline-openrouter"
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

/**
 * EditorContent component that handles auto-accept for AI generation
 */
function EditorContentArea({
  editor,
  articleId,
}: {
  editor: Editor | null
  articleId?: string
}) {
  const {
    aiGenerationIsLoading,
    aiGenerationIsSelection,
    aiGenerationHasMessage,
  } = useUiEditorState(editor)

  // Auto-accept AI generation when it completes (for non-selection edits)
  useEffect(() => {
    if (!editor) return

    if (
      !aiGenerationIsLoading &&
      aiGenerationIsSelection &&
      aiGenerationHasMessage
    ) {
      editor.chain().focus().aiAccept().run()
      editor.commands.resetUiState()
    }
  }, [
    aiGenerationHasMessage,
    aiGenerationIsLoading,
    aiGenerationIsSelection,
    editor,
  ])

  return (
    <div className="relative">
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
    </div>
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

type SimpleEditorProps = {
  /** Tiptap JSON. Defaults to the built-in demo document from `data/content.json`. */
  initialDocument?: Record<string, unknown>
  /** Called when the editor instance is ready. Use for saving text/HTML from the parent. */
  onEditorReady?: (editor: Editor) => void
  /** Called when the editor content changes. */
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
  onContentChange,
  embedded = false,
  articleId,
  toolbarActions,
  toolbarClassName,
}: SimpleEditorProps = {}) {
  const isMobile = useIsBreakpoint()
  const toolbarRef = useRef<HTMLDivElement>(null)
  const doc = (initialDocument ?? simpleEditorEmptyDocument) as Record<string, unknown>

  const extensions = useMemo(
    () =>
      [
        ...getArticleTiptapExtensions({
          linkOpenOnClick: false,
          articleId,
        }),
        Ai.configure({
          appId: TIPTAP_AI_APP_ID,
          token: TIPTAP_AI_TOKEN || undefined,
          autocompletion: false,
          showDecorations: true,
          hideDecorationsOnStreamEnd: false,
          aiStreamResolver: createEditorOpenRouterStreamResolver(),
          aiCompletionResolver: createEditorOpenRouterCompletionResolver(),
          onLoading: (context) => {
            context.editor.commands.aiGenerationSetIsLoading(true)
            context.editor.commands.aiGenerationHasMessage(false)
          },
          onChunk: (context) => {
            context.editor.commands.aiGenerationSetIsLoading(true)
            context.editor.commands.aiGenerationHasMessage(true)
          },
          onSuccess: (context) => {
            const hasMessage = !!context.response
            context.editor.commands.aiGenerationSetIsLoading(false)
            context.editor.commands.aiGenerationHasMessage(hasMessage)
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
          "aria-label": "Main content area, start typing to enter text.",
          class: "simple-editor",
        },
      },
      onCreate: ({ editor: e }) => {
        onEditorReady?.(e)
      },
      onUpdate: ({ editor: e }) => {
        onContentChange?.(e.getJSON())
      },
      extensions,
      content: doc,
    },
    [extensions, doc],
  )

  const slashMenuConfig = useMemo(
    () =>
      ({
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
      } as SlashMenuConfig),
    [],
  )

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
