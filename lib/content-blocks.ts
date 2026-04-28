/**
 * Horizontal alignment for a content block. Omit or `left` for the default.
 */
export type BlockAlign = "left" | "center" | "right" | "justify"

type AlignOpt = { align?: BlockAlign }

/**
 * Structured article body. Each item is one block; order is preserved in the UI.
 * `text` supports a small Markdown subset. **Image:** `url` and `alt` are only for the `<img>` (not shown as copy). Optional `label` / `caption` (markdown) is the only optional line under the photo. **Table:** optional `label` / `caption` (markdown) appears under the table, not prefixed in the UI.
 */
export type ContentBlock =
  | (AlignOpt & { type: "heading"; level: 2 | 3 | 4; text: string })
  | (AlignOpt & { type: "paragraph"; text: string })
  | (AlignOpt & {
      type: "table"
      headers: string[]
      rows: string[][]
      /** Optional caption under the table (markdown). `caption` is a legacy alias. */
      label?: string
      caption?: string
    })
  | (AlignOpt & { type: "list"; ordered: boolean; items: string[] })
  | (AlignOpt & { type: "blockquote"; text: string; attribution?: string })
  | (AlignOpt & {
      type: "image"
      url: string
      /** Optional caption under the image (markdown). Use `label` or legacy `caption`. */
      label?: string
      caption?: string
      /** `img` `alt` text for accessibility only (not rendered as body text). */
      alt?: string
    })
