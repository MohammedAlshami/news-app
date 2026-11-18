import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import type { Node as PMNode } from "@tiptap/pm/model"

const KEY = new PluginKey("articleDirAuto")

/** Node types that start a new "line of text" whose direction should follow its own content. */
const DIR_AUTO_TYPES = new Set([
  "paragraph",
  "heading",
  "listItem",
  "taskItem",
  "codeBlock",
])

export function buildDirDecorations(doc: PMNode): DecorationSet {
  const decos: Decoration[] = []
  doc.descendants((node, pos) => {
    if (DIR_AUTO_TYPES.has(node.type.name)) {
      decos.push(Decoration.node(pos, pos + node.nodeSize, { dir: "auto" }))
    }
    return true
  })
  return DecorationSet.create(doc, decos)
}

/**
 * Sets `dir="auto"` on text blocks and list items as DOM decorations (NOT document attributes), so
 * an English paragraph inside an Arabic article lays out LTR and bullets flip with their text,
 * without polluting the stored JSON the way core's `textDirection` option does (it writes a `dir`
 * attr on every node).
 */
export const ArticleDirAuto = Extension.create({
  name: "articleDirAuto",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: KEY,
        state: {
          init: (_, state) => buildDirDecorations(state.doc),
          apply: (tr, old) => (tr.docChanged ? buildDirDecorations(tr.doc) : old),
        },
        props: {
          decorations(state) {
            return KEY.getState(state)
          },
        },
      }),
    ]
  },
})
