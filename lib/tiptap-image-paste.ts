import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"

import {
  describeUploadError,
  IMAGE_MESSAGES,
  stripInlineImages,
  validateImageFile,
} from "@/lib/tiptap-image-utils"

type Options = {
  upload: ((file: File) => Promise<string>) | null
  notify: (message: string, kind: "error" | "info") => void
}

function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((f) => f.type.startsWith("image/"))
}

/**
 * Handles pasted/dropped image FILES by uploading them through the article upload action (instead of
 * letting the browser inline them as base64), and strips pasted data:/blob: <img> markup.
 */
export const ArticleImagePaste = Extension.create<Options>({
  name: "articleImagePaste",
  addOptions() {
    return { upload: null, notify: () => {} }
  },
  addProseMirrorPlugins() {
    const editor = this.editor
    const { upload, notify } = this.options

    const insertFiles = (files: File[], pos?: number) => {
      if (!upload) {
        notify(IMAGE_MESSAGES.uploadFailed, "error")
        return
      }
      for (const file of files) {
        const invalid = validateImageFile(file)
        if (invalid) {
          notify(invalid, "error")
          continue
        }
        notify(IMAGE_MESSAGES.uploading, "info")
        upload(file)
          .then((src) => {
            if (editor.isDestroyed) return
            const chain = editor.chain()
            if (pos !== undefined) chain.insertContentAt(pos, { type: "image", attrs: { src } })
            else chain.insertContent({ type: "image", attrs: { src } })
            chain.run()
            notify("", "info")
          })
          .catch((e) => notify(describeUploadError(e), "error"))
      }
    }

    return [
      new Plugin({
        key: new PluginKey("articleImagePaste"),
        props: {
          handlePaste(_view: EditorView, event: ClipboardEvent) {
            const files = imageFiles(event.clipboardData?.files)
            if (files.length === 0) return false
            event.preventDefault()
            insertFiles(files)
            return true
          },
          handleDrop(view: EditorView, event: DragEvent) {
            const files = imageFiles(event.dataTransfer?.files)
            if (files.length === 0) return false
            event.preventDefault()
            const at = view.posAtCoords({ left: event.clientX, top: event.clientY })
            insertFiles(files, at?.pos)
            return true
          },
          transformPastedHTML(html: string) {
            const { html: clean, removed } = stripInlineImages(html)
            if (removed > 0) notify(IMAGE_MESSAGES.inlineStripped, "error")
            return clean
          },
        },
      }),
    ]
  },
})
