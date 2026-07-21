"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"

import { AiMenuInputTextarea } from "@/components/tiptap-ui/ai-menu-input"
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
      const fullText = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", "\n")
      if (fullText.trim()) {
        promptWithContext = `Article content:\n${fullText}\n\nUser request: ${prompt}`
      }
      if (articleContext) {
        promptWithContext = `${articleContext}\n\n${promptWithContext}`
      }
      if (tone) {
        promptWithContext = `${promptWithContext}\n\nTone: ${tone}`
      }

      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            editorInline: true,
            mode: "write",
            prompt: promptWithContext,
          }),
        })
        if (!response.ok) {
          setError("فشل الاتصال بالذكاء الاصطناعي")
          return
        }

        const text = await response.text()
        if (!text.trim()) {
          setError("لم يتم الحصول على رد من الذكاء الاصطناعي")
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

        // Replace entire document content
        const { doc } = editor.state
        const from = 1
        const to = doc.content.size - 1
        if (from < to) {
          editor.chain().focus().deleteRange({ from, to }).insertContent(html).run()
        } else {
          editor.chain().focus().insertContent(html).run()
        }
      } catch (err) {
        setError("حدث خطأ أثناء الاتصال بالذكاء الاصطناعي")
      } finally {
        setIsLoading(false)
      }
    },
    [editor, tone, articleContext],
  )

  const handleClose = useCallback(() => {
    setIsExpanded(false)
    setError(null)
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
