type TiptapNode = { type?: string; text?: string; content?: TiptapNode[] }

/** Flatten a stringified Tiptap doc to plain text (paragraphs separated by blank lines). */
export function tiptapToText(json: string | null | undefined, maxChars = 4000): string {
  if (!json) return ""
  let doc: TiptapNode
  try {
    doc = JSON.parse(json) as TiptapNode
  } catch {
    return json.slice(0, maxChars)
  }
  const blocks: string[] = []
  const walk = (n: TiptapNode, acc: string[]) => {
    if (typeof n.text === "string") acc.push(n.text)
    for (const c of n.content ?? []) walk(c, acc)
  }
  for (const block of doc.content ?? []) {
    const acc: string[] = []
    walk(block, acc)
    const t = acc.join("").trim()
    if (t) blocks.push(t)
  }
  return blocks.join("\n\n").slice(0, maxChars)
}
