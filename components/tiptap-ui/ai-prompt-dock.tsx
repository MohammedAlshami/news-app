"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Sparkles } from "lucide-react"

import { AiMenuInputTextarea } from "@/components/tiptap-ui/ai-menu-input"
import { getContextAndInsertAt } from "@/components/tiptap-ui/ai-menu-utils"
import { cn } from "@/lib/utils"

import "@/components/tiptap-ui/ai-prompt-dock.scss"

type AiPromptDockProps = {
  editor?: import("@tiptap/react").Editor | null
  articleId?: string
}

export function AiPromptDock({ editor: providedEditor, articleId }: AiPromptDockProps) {
  const editor = providedEditor
  const [tone, setTone] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [articleContext, setArticleContext] = useState<string>("")
  const selectionSnapshotRef = useRef<{
    hasSelection: boolean
    context: string
  }>({
    hasSelection: false,
    context: "",
  })

  // Fetch article context when component mounts
  useEffect(() => {
    if (articleId) {
      // Get the article title and excerpt from the form
      const titleInput = document.querySelector<HTMLInputElement>('input[name="title"]')
      const excerptTextarea = document.querySelector<HTMLTextAreaElement>('textarea[name="excerpt"]')
      
      const title = titleInput?.value || ""
      const excerpt = excerptTextarea?.value || ""
      
      if (title || excerpt) {
        setArticleContext(`Article Title: ${title}\nArticle Excerpt: ${excerpt}`)
      }
    }
  }, [articleId])

  useEffect(() => {
    if (!editor) return

    const updateSnapshot = () => {
      const { context } = getContextAndInsertAt(editor)
      selectionSnapshotRef.current = {
        hasSelection: !editor.state.selection.empty,
        context: context || "",
      }
    }

    updateSnapshot()
    editor.on("selectionUpdate", updateSnapshot)

    return () => {
      editor.off("selectionUpdate", updateSnapshot)
    }
  }, [editor])

  const handleSubmit = useCallback(
    (prompt: string) => {
      if (!editor || !prompt.trim()) return

      const snapshot = selectionSnapshotRef.current
      let promptWithContext = prompt
      
      // Add article context if available
      if (articleContext) {
        promptWithContext = `${articleContext}\n\n${promptWithContext}`
      }
      
      // Add selection context
      if (snapshot.context) {
        promptWithContext = `${snapshot.context}\n\n${promptWithContext}`
      }
      
      const hasSelection = snapshot.hasSelection

      // Don't set needs commit - let it stream directly
      editor.commands.aiGenerationSetIsSelection(false)
      editor.commands.aiGenerationShow()

      editor
        .chain()
        .focus()
        .aiTextPrompt({
          text: promptWithContext,
          insert: true,
          stream: true,
          tone: tone || undefined,
          format: "rich-text",
        })
        .run()
    },
    [editor, tone, articleContext]
  )

  const handleClose = useCallback(() => {
    setIsExpanded(false)
  }, [])

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="absolute bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground transition-all hover:scale-110 dark:bg-white dark:text-foreground"
        aria-label="Open AI assistant"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className={cn("tiptap-ai-prompt-dock", isExpanded && "expanded")}>
      <AiMenuInputTextarea
        showPlaceholder={false}
        placeholder="اطلب من الذكاء الاصطناعي التحرير أو التحسين أو المتابعة..."
        onInputSubmit={handleSubmit}
        onToneChange={(value) => setTone(value)}
        onClose={handleClose}
      />
    </div>
  )
}
