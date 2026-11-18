import { renderDocBlocks, type PMNode } from "@/lib/article-body-render"
import { parseArticleBodyToTiptapDoc } from "@/lib/parse-article-body"
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
  /** Stored article body (Tiptap JSON string, or legacy plain text). */
  body: string
  className?: string
}

export function ArticleBody({ body, className }: Props) {
  const doc = parseArticleBodyToTiptapDoc(body) as PMNode
  // Older generated articles end with a "المصادر: …" credits paragraph; it is no longer shown.
  const last = doc.content?.[doc.content.length - 1]
  if (last?.type === "paragraph" && last.content?.[0]?.type === "text" && String(last.content[0].text ?? "").startsWith("المصادر:")) {
    doc.content = doc.content!.slice(0, -1)
  }
  return (
    <div className={cn("simple-editor-wrapper article-body w-full", className)} data-preview-readonly>
      <div className="simple-editor-content w-full">
        <div className="tiptap ProseMirror simple-editor">
          {renderDocBlocks(doc)}
        </div>
      </div>
    </div>
  )
}
