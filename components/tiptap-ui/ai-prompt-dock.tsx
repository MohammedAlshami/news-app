"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { AiMenuInputTextarea } from "@/components/tiptap-ui/ai-menu-input"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { getContextAndInsertAt } from "@/components/tiptap-ui/ai-menu-utils"

import "@/components/tiptap-ui/ai-prompt-dock.scss"

type AiPromptDockProps = {
  editor?: import("@tiptap/react").Editor | null
}

export function AiPromptDock({ editor: providedEditor }: AiPromptDockProps) {
  const { editor } = useTiptapEditor(providedEditor)
  const [tone, setTone] = useState<string | null>(null)
  const selectionSnapshotRef = useRef<{
    hasSelection: boolean
    context: string
  }>({
    hasSelection: false,
    context: "",
  })

  useEffect(() => {
    if (!editor) return

    const updateSnapshot = () => {
      const { context } = getContextAndInsertAt(editor)
      selectionSnapshotRef.current = {
        hasSelection: !editor.state.selection.empty,
        context,
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
      const promptWithContext = snapshot.context
        ? `${snapshot.context}\n\n${prompt}`
        : prompt
      const hasSelection = snapshot.hasSelection

      editor.commands.aiGenerationSetIsSelection(hasSelection)
      editor.commands.aiGenerationSetNeedsCommit(hasSelection)
      editor.commands.aiGenerationShow()

      editor
        .chain()
        .focus()
        .aiTextPrompt({
          text: promptWithContext,
          insert: !hasSelection,
          stream: true,
          tone: tone || undefined,
          format: "rich-text",
        })
        .run()
    },
    [editor, tone]
  )

  return (
    <div className="tiptap-ai-prompt-dock">
      <AiMenuInputTextarea
        showPlaceholder={false}
        placeholder="Tell AI what else needs to be changed..."
        onInputSubmit={handleSubmit}
        onToneChange={(value) => setTone(value)}
      />
    </div>
  )
}
