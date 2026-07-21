"use client"

import type { Editor } from "@tiptap/react"
import { useEffect, useState } from "react"
import {
  defaultUiState,
  type UiState,
} from "@/components/tiptap-extension/ui-state-extension"

export function useUiEditorState(editor: Editor | null): UiState {
  const [state, setState] = useState<UiState>(() => {
    if (!editor) return defaultUiState
    const s = editor.storage.uiState
    return s ? { ...defaultUiState, ...s } : defaultUiState
  })

  useEffect(() => {
    if (!editor) {
      setState(defaultUiState)
      return
    }
    const update = () => {
      const s = editor.storage.uiState
      setState(s ? { ...defaultUiState, ...s } : defaultUiState)
    }
    const ed = editor as any
    ed.on("transaction", update)
    ed.on("update", update)
    ed.on("uiStateChanged", update)
    return () => {
      ed.off("transaction", update)
      ed.off("update", update)
      ed.off("uiStateChanged", update)
    }
  }, [editor])

  return state
}

export default useUiEditorState
