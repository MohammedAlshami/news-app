import { tiptapEmptyDocument } from "@/lib/tiptap-empty-doc"

/**
 * `body` is stored as Tiptap JSON string, or legacy plain text (wrapped in a paragraph).
 */
export function parseArticleBodyToTiptapDoc(
  body: string,
): Record<string, unknown> {
  const trimmed = body.trim()
  if (!trimmed) {
    return { ...tiptapEmptyDocument } as unknown as Record<string, unknown>
  }
  try {
    const p = JSON.parse(trimmed) as { type?: string }
    if (p?.type === "doc") {
      return p as unknown as Record<string, unknown>
    }
  } catch {
    // fall through to plain text
  }
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: trimmed }],
      },
    ],
  } as unknown as Record<string, unknown>
}
