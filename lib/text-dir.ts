/**
 * Direction of a text from its first strongly-directional letter (Arabic/Hebrew → rtl, Latin etc. → ltr).
 * `dir="auto"` is NOT enough for containers: browsers skip descendants that carry their own `dir`, so a
 * list/blockquote whose paragraphs all have `dir="auto"` sees no text and falls back to LTR (bullets on the
 * wrong side). Containers get an explicit direction from this instead. No strong letter → rtl (Arabic site).
 */
const RTL = /[֐-ࣿיִ-﷿ﹰ-ﻼ]/
const LTR = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/

export function firstStrongDir(text: string): "rtl" | "ltr" {
  for (const ch of text) {
    if (RTL.test(ch)) return "rtl"
    if (LTR.test(ch)) return "ltr"
  }
  return "rtl"
}
