import { Extension } from "@tiptap/core"

export interface UiState {
  aiGenerationIsSelection: boolean
  aiGenerationIsLoading: boolean
  aiGenerationActive: boolean
  aiGenerationHasMessage: boolean
  commentInputVisible: boolean
  lockDragHandle: boolean
  isDragging: boolean
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    uiState: {
      aiGenerationSetIsSelection: (value: boolean) => ReturnType
      aiGenerationSetIsLoading: (value: boolean) => ReturnType
      aiGenerationShow: () => ReturnType
      aiGenerationHide: () => ReturnType
      aiGenerationHasMessage: (value: boolean) => ReturnType

      commentInputShow: () => ReturnType
      commentInputHide: () => ReturnType

      setLockDragHandle: (value: boolean) => ReturnType

      resetUiState: () => ReturnType
      setIsDragging: (value: boolean) => ReturnType
    }
  }

  interface Storage {
    uiState: UiState
  }
}

export const defaultUiState: UiState = {
  aiGenerationIsSelection: false,
  aiGenerationIsLoading: false,
  aiGenerationActive: false,
  aiGenerationHasMessage: false,
  commentInputVisible: false,
  lockDragHandle: false,
  isDragging: false,
} as const

export const UiState = Extension.create<UiState>({
  name: "uiState",

  addStorage() {
    return { ...defaultUiState }
  },

  addCommands() {
    const setAndNotify =
      (key: keyof UiState, value: boolean) => () => {
        this.storage[key] = value
        try { setTimeout(() => (this.editor as any).emit("uiStateChanged")) } catch {}
        return true
      }

    return {
      aiGenerationSetIsSelection: (value: boolean) => setAndNotify("aiGenerationIsSelection", value),
      aiGenerationSetIsLoading: (value: boolean) => setAndNotify("aiGenerationIsLoading", value),
      aiGenerationHasMessage: (value: boolean) => setAndNotify("aiGenerationHasMessage", value),
      aiGenerationShow: () => setAndNotify("aiGenerationActive", true),
      aiGenerationHide: () => setAndNotify("aiGenerationActive", false),

      commentInputShow: () => setAndNotify("commentInputVisible", true),
      commentInputHide: () => setAndNotify("commentInputVisible", false),

      setLockDragHandle: (value: boolean) => setAndNotify("lockDragHandle", value),
      setIsDragging: (value: boolean) => setAndNotify("isDragging", value),

      resetUiState: () => () => {
        Object.assign(this.storage, { ...defaultUiState })
        try { setTimeout(() => (this.editor as any).emit("uiStateChanged")) } catch {}
        return true
      },
    }
  },
})
