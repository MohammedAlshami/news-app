import { Highlight } from "@tiptap/extension-highlight"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Selection } from "@tiptap/extensions"
import { StarterKit } from "@tiptap/starter-kit"
import type { AnyExtension } from "@tiptap/core"

import { uploadArticleInlineImageAction } from "@/app/admin/articles/actions"
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

type Options = {
  /** `false` in the admin editor; `true` in read-only preview so links are clickable. */
  linkOpenOnClick?: boolean
  /** When set, image uploads go to R2 (or local fallback) for this article. */
  articleId?: string
}

function createArticleImageUploadHandler(articleId: string) {
  return async (
    file: File,
    onProgress?: (event: { progress: number }) => void,
    abortSignal?: AbortSignal,
  ): Promise<string> => {
    if (!file) {
      throw new Error("No file provided")
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`,
      )
    }
    if (abortSignal?.aborted) {
      throw new Error("Upload cancelled")
    }
    const fd = new FormData()
    fd.set("file", file)
    const r = await uploadArticleInlineImageAction(articleId, fd)
    if (!r.ok) {
      throw new Error(r.error)
    }
    onProgress?.({ progress: 100 })
    return r.url
  }
}

/**
 * Shared Tiptap extension pack for the article body (SimpleEditor and read-only preview).
 * SCSS for nodes is loaded by the component that hosts the editor (e.g. simple-editor / read-only).
 */
export function getArticleTiptapExtensions(
  options: Options = {},
): AnyExtension[] {
  const { linkOpenOnClick = false, articleId } = options
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
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Image,
    Typography,
    Selection,
    ImageUploadNode.configure({
      accept: "image/*",
      maxSize: MAX_FILE_SIZE,
      limit: 3,
      upload: imageUploadHandler,
      onError: (error) => {
        console.error("Upload failed:", error)
      },
    }),
  ]
}
