import { Highlight } from "@tiptap/extension-highlight"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Selection } from "@tiptap/extensions"
import { StarterKit } from "@tiptap/starter-kit"
import type { AnyExtension } from "@tiptap/core"

import { uploadArticleInlineImageAction } from "@/app/admin/articles/actions"
import { UiState } from "@/components/tiptap-extension/ui-state-extension"
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import { ArticleDirAuto } from "@/lib/tiptap-article-rtl"
import { ArticleImagePaste } from "@/lib/tiptap-image-paste"
import { describeUploadError, IMAGE_MESSAGES, MAX_IMAGE_BYTES } from "@/lib/tiptap-image-utils"
import { handleImageUpload } from "@/lib/tiptap-utils"

type Options = {
  /** `false` in the admin editor; `true` in read-only preview so links are clickable. */
  linkOpenOnClick?: boolean
  /** When set, image uploads go to R2 (or local fallback) for this article. */
  articleId?: string
  /** Editor-only: surfaces upload/paste problems in the UI. Omit for read-only rendering. */
  onNotify?: (message: string, kind: "error" | "info") => void
}

function createArticleImageUploadHandler(articleId: string) {
  return async (
    file: File,
    // No onProgress: server actions give no byte progress, and we do not fake it.
    _onProgress?: (event: { progress: number }) => void,
    abortSignal?: AbortSignal,
  ): Promise<string> => {
    if (!file) {
      throw new Error(IMAGE_MESSAGES.notImage)
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(IMAGE_MESSAGES.tooLarge)
    }
    if (abortSignal?.aborted) {
      throw new Error("Upload cancelled")
    }
    const fd = new FormData()
    fd.set("file", file)
    try {
      const r = await uploadArticleInlineImageAction(articleId, fd)
      if (!r.ok) {
        throw new Error(r.error)
      }
      return r.url
    } catch (e) {
      // Oversized bodies / network errors from the server-action transport are not user-readable.
      throw new Error(describeUploadError(e))
    }
  }
}

/**
 * Shared Tiptap extension pack for the article body (SimpleEditor and read-only preview).
 * SCSS for nodes is loaded by the component that hosts the editor (e.g. simple-editor / read-only).
 */
export function getArticleTiptapExtensions(
  options: Options = {},
): AnyExtension[] {
  const { linkOpenOnClick = false, articleId, onNotify } = options
  const imageUploadHandler = articleId
    ? createArticleImageUploadHandler(articleId)
    : handleImageUpload
  return [
    StarterKit.configure({
      horizontalRule: false,
      code: false,
      link: {
        openOnClick: linkOpenOnClick,
        enableClickSelection: true,
      },
    }),
    HorizontalRule,
    // RTL article: "right" is the natural start edge; the toolbar's left/right still work explicitly.
    TextAlign.configure({ types: ["heading", "paragraph"], defaultAlignment: "right" }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    // Never keep base64 images in the stored body (they bloat the row and bypass upload validation).
    Image.configure({ allowBase64: false }),
    // English smart-quote rules corrupt Arabic text, so quotes/fractions/multiplication are off.
    Typography.configure({
      openDoubleQuote: false,
      closeDoubleQuote: false,
      openSingleQuote: false,
      closeSingleQuote: false,
      oneHalf: false,
      oneQuarter: false,
      threeQuarters: false,
      multiplication: false,
      superscriptTwo: false,
      superscriptThree: false,
    }),
    ArticleDirAuto,
    Selection,
    UiState,
    ImageUploadNode.configure({
      accept: "image/*",
      maxSize: MAX_IMAGE_BYTES,
      limit: 3,
      upload: imageUploadHandler,
      onError: (error) => {
        console.error("Upload failed:", error)
        onNotify?.(describeUploadError(error), "error")
      },
    }),
    ...(onNotify
      ? [
          ArticleImagePaste.configure({
            upload: articleId ? (file: File) => imageUploadHandler(file) : null,
            notify: onNotify,
          }),
        ]
      : []),
  ]
}
