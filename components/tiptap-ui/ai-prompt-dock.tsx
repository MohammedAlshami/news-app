"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"

import { AiMenuInputTextarea } from "@/components/tiptap-ui/ai-menu-input"
import {
  AI_EMPTY_MESSAGE,
  AI_TRUNCATED_EMPTY_MESSAGE,
  aiErrorMessage,
  describeAiHttpError,
  isAbortError,
  stripAiControlMarks,
} from "@/lib/ai-stream"
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [articleContext, setArticleContext] = useState<string>("")
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    if (articleId) {
      const titleInput = document.querySelector<HTMLInputElement>('input[name="title"]')
      const excerptTextarea = document.querySelector<HTMLTextAreaElement>('textarea[name="excerpt"]')
      const title = titleInput?.value || ""
      const excerpt = excerptTextarea?.value || ""
      if (title || excerpt) {
        setArticleContext(`Article Title: ${title}\nArticle Excerpt: ${excerpt}`)
      }
    }
  }, [articleId])



  const handleSubmit = useCallback(
    async (prompt: string) => {
      if (!editor || !prompt.trim()) return
      setError(null)
      setIsLoading(true)

      // Build prompt with full article context
      let promptWithContext = prompt
      const fullText = editor.state.doc
        .textBetween(0, editor.state.doc.content.size, "\n", "\n")
        .slice(0, 40_000) // stay under the /api/ai prompt cap
      const sel = editor.state.selection
      const selectedText = sel.empty ? "" : editor.state.doc.textBetween(sel.from, sel.to, "\n", "\n").slice(0, 10_000)
      if (fullText.trim()) {
        promptWithContext = `Article content:\n${fullText}\n\nUser request: ${prompt}`
      }
      if (selectedText.trim()) {
        promptWithContext += `\n\nApply the request ONLY to this selected text and reply with just its replacement:\n${selectedText}`
      }
      if (articleContext) {
        promptWithContext = `${articleContext}\n\n${promptWithContext}`
      }
      if (tone) {
        promptWithContext = `${promptWithContext}\n\nTone: ${tone}`
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            editorInline: true,
            mode: "write",
            prompt: promptWithContext,
          }),
          signal: controller.signal,
        })
        if (!response.ok) {
          const errorText = await response.text().catch(() => "")
          setError(describeAiHttpError(response.status, errorText))
          return
        }

        const filtered = stripAiControlMarks(await response.text())
        const text = filtered.text
        if (!text.trim()) {
          setError(filtered.truncated ? AI_TRUNCATED_EMPTY_MESSAGE : AI_EMPTY_MESSAGE)
          return
        }

        const html = text
          .trim()
          .split(/\n{2,}/)
          .map(
            (p) =>
              `<p>${p
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\n/g, "<br>")}</p>`,
          )
          .join("")

        // Never overwrite the whole article. Replace the selection when there is one, otherwise add the
        // new text after the block the cursor is in (or at the end of the document).
        const { selection, doc } = editor.state
        if (!selection.empty) {
          editor.chain().focus().insertContentAt({ from: selection.from, to: selection.to }, html).run()
        } else {
          const pos = selection.$to.depth >= 1 ? selection.$to.after(1) : doc.content.size
          editor.chain().focus().insertContentAt(Math.min(pos, doc.content.size), html).run()
        }
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return
        setError(aiErrorMessage(err))
      } finally {
        if (abortRef.current === controller) abortRef.current = null
        setIsLoading(false)
      }
    },
    [editor, tone, articleContext],
  )

  const handleClose = useCallback(() => {
    abortRef.current?.abort()
    setIsExpanded(false)
    setError(null)
  }, [])

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="absolute bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground transition-all hover:scale-110 dark:bg-white dark:text-foreground"
        aria-label="فتح مساعد الذكاء الاصطناعي"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className={cn("tiptap-ai-prompt-dock", isExpanded && "expanded")}>
      {isLoading ? (
        <div className="flex items-center gap-3 p-4 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>الذكاء الاصطناعي يكتب...</span>
        </div>
      ) : error ? (
        <div className="p-4">
          <p className="text-sm text-red-500 mb-2">{error}</p>
          <AiMenuInputTextarea
            showPlaceholder={false}
            placeholder="اطلب من الذكاء الاصطناعي التحرير أو التحسين أو المتابعة..."
            onInputSubmit={handleSubmit}
            onToneChange={(value) => setTone(value)}
            onClose={handleClose}
          />
        </div>
      ) : (
        <AiMenuInputTextarea
          showPlaceholder={false}
          placeholder="اطلب من الذكاء الاصطناعي التحرير أو التحسين أو المتابعة..."
          onInputSubmit={handleSubmit}
          onToneChange={(value) => setTone(value)}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
