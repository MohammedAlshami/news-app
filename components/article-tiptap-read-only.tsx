"use client"

import { EditorContent, useEditor } from "@tiptap/react"
import { useMemo } from "react"

import { parseArticleBodyToTiptapDoc } from "@/lib/parse-article-body"
import { getArticleTiptapExtensions } from "@/lib/tiptap-article-extensions"
import { cn } from "@/lib/utils"

import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"
import "@/components/tiptap-templates/simple/simple-editor.scss"

type Props = {
  body: string
  className?: string
}

/**
 * Renders the stored Tiptap JSON body with the same extensions and styles as the admin editor
 * (read-only) — for preview pages.
 */
export function ArticleTiptapReadOnly({ body, className }: Props) {
  const content = useMemo(
    () => parseArticleBodyToTiptapDoc(body),
    [body],
  )

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: getArticleTiptapExtensions({ linkOpenOnClick: true }),
      content,
      editable: false,
      editorProps: {
        attributes: {
          class: "simple-editor",
        },
      },
    },
    [body],
  )

  if (!editor) {
    return <div className="min-h-32" aria-hidden />
  }

  return (
    <div
      className={cn("simple-editor-wrapper w-full", className)}
      data-preview-readonly
    >
      <EditorContent
        editor={editor}
        className="simple-editor-content w-full"
      />
    </div>
  )
}
