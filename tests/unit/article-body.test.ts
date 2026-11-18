import assert from "node:assert/strict"
import { test } from "node:test"
import { execFileSync } from "node:child_process"

import { safeLinkHref } from "@/lib/article-body-render"
import { tiptapToText } from "@/lib/tiptap-text"

/** Batch-render bodies in a child process (react-dom/server cannot load under `--conditions=react-server`). */
function renderAll(bodies: Record<string, string>): Record<string, string> {
  const out = execFileSync(process.execPath, ["--import", "tsx", "tests/unit/helpers/render-body.mts"], {
    input: JSON.stringify(bodies),
    encoding: "utf8",
    cwd: process.cwd(),
    maxBuffer: 64 * 1024 * 1024,
  })
  return JSON.parse(out)
}

function decode(s: string) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
}

/** Visible text with all whitespace removed (block separators differ between the two helpers). */
function visible(html: string): string {
  const stripped = html
    .replace(/<span data-type="(mention|emoji|math)"[^>]*>.*?<\/span>/g, "")
    .replace(/<div data-type="math"[^>]*>.*?<\/div>/g, "")
    .replace(/<[^>]+>/g, "")
  return decode(stripped).replace(/\s+/g, "")
}

const t = (text: string, marks?: unknown[]) => ({ type: "text", text, ...(marks ? { marks } : {}) })
const p = (...c: unknown[]) => ({ type: "paragraph", content: c })

const fixtures: Record<string, unknown> = {
  basic: { type: "doc", content: [p(t("مرحباً بالعالم")), p(t("Second "), t("bold", [{ type: "bold" }]), t(" & <tag>"))] },
  nestedLists: {
    type: "doc",
    content: [
      {
        type: "bulletList",
        content: [
          { type: "listItem", content: [p(t("واحد")), { type: "orderedList", content: [{ type: "listItem", content: [p(t("one-a"))] }, { type: "listItem", content: [p(t("one-b"))] }] }] },
          { type: "listItem", content: [p(t("اثنان"))] },
        ],
      },
      { type: "taskList", content: [{ type: "taskItem", attrs: { checked: true }, content: [p(t("done"))] }] },
    ],
  },
  table: {
    type: "doc",
    content: [
      {
        type: "table",
        content: [
          { type: "tableRow", content: [{ type: "tableHeader", content: [p(t("H1"))] }, { type: "tableHeader", content: [p(t("H2"))] }] },
          { type: "tableRow", content: [{ type: "tableCell", attrs: { colspan: 2 }, content: [p(t("cell"))] }] },
        ],
      },
    ],
  },
  mentionEmoji: {
    type: "doc",
    content: [p(t("Hi "), { type: "mention", attrs: { id: "u1", label: "Sara" } }, t(" "), { type: "emoji", attrs: { name: "smile", emoji: "😀" } }, t(" bye"))],
  },
  jsLink: {
    type: "doc",
    content: [p(t("click me", [{ type: "link", attrs: { href: "javascript:alert(1)" } }]), t(" and "), t("ok", [{ type: "link", attrs: { href: "https://example.com/a" } }]))],
  },
  misc: {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1 }, content: [t("Title in body")] },
      { type: "heading", attrs: { level: 3 }, content: [t("Sub")] },
      { type: "blockquote", content: [p(t("quote"))] },
      { type: "codeBlock", attrs: { language: "js" }, content: [t("const a = 1 < 2")] },
      { type: "horizontalRule" },
      p(t("a"), { type: "hardBreak" }, t("b")),
      { type: "weirdCustomNode", content: [p(t("inside unknown"))] },
      p(t("unknown mark", [{ type: "sparkle" }])),
    ],
  },
}

const extra: Record<string, string> = {
  align: JSON.stringify({ type: "doc", content: [{ type: "paragraph", attrs: { textAlign: "center" }, content: [t("x")] }] }),
  legacy: "just plain legacy text",
  captioned: JSON.stringify({
    type: "doc",
    content: [
      { type: "image", attrs: { src: "https://x.test/a.jpg", alt: "a", "data-align": "center", showCaption: true }, content: [{ type: "text", text: "تعليق الصورة" }] },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "بند" }] }] }] },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "First" }] }] }] },
    ],
  }),
  images: JSON.stringify({
    type: "doc",
    content: [
      { type: "image", attrs: { src: "javascript:alert(1)" } },
      { type: "image", attrs: { src: "https://x.test/a.jpg", alt: "وصف", width: 800, height: 400 } },
    ],
  }),
}
const rendered = renderAll({
  ...Object.fromEntries(Object.entries(fixtures).map(([k, v]) => [k, JSON.stringify(v)])),
  ...extra,
})
const render = (body: string) => {
  const key = Object.keys(fixtures).find((k) => JSON.stringify(fixtures[k]) === body) ?? Object.keys(extra).find((k) => extra[k] === body)
  return rendered[key!]
}

for (const [name, doc] of Object.entries(fixtures)) {
  test(`article body renders same visible text as tiptapToText: ${name}`, () => {
    const json = JSON.stringify(doc)
    assert.equal(visible(render(json)), tiptapToText(json, 1_000_000).replace(/\s+/g, ""))
  })
}

test("javascript: links are dropped, http links get safe rel", () => {
  const html = render(JSON.stringify(fixtures.jsLink))
  assert.ok(!html.includes("javascript:"))
  assert.match(html, /<a href="https:\/\/example\.com\/a" target="_blank" rel="noopener noreferrer nofollow ugc">ok<\/a>/)
  assert.equal(safeLinkHref("  JaVa\nScript:alert(1)"), null)
  assert.equal(safeLinkHref("data:text/html,x"), null)
  assert.equal(safeLinkHref("//evil.com"), null)
  assert.equal(safeLinkHref("mailto:a@b.co"), "mailto:a@b.co")
  assert.equal(safeLinkHref("tel:+123"), "tel:+123")
})

test("structure: dir=auto, h1 demoted, mentions/emoji rendered, unknown node children kept", () => {
  const html = render(JSON.stringify(fixtures.misc))
  assert.match(html, /<h2 dir="auto">Title in body<\/h2>/)
  assert.match(html, /<h3 dir="auto">Sub<\/h3>/)
  assert.ok(html.includes("inside unknown"))
  assert.ok(!html.includes("<h1"))
  assert.ok(html.includes("<br/>"))
  const me = render(JSON.stringify(fixtures.mentionEmoji))
  assert.ok(me.includes("@Sara") && me.includes("😀"))
  assert.match(render(JSON.stringify(fixtures.table)), /<td colSpan="2">|<td colspan="2">/)
})

test("text-align and legacy plain-text bodies", () => {
  const html = render(JSON.stringify({ type: "doc", content: [{ type: "paragraph", attrs: { textAlign: "center" }, content: [t("x")] }] }))
  assert.match(html, /style="text-align:center"/)
  assert.ok(render("just plain legacy text").includes("just plain legacy text"))
})

test("unsafe image src is dropped; image gets alt and lazy loading", () => {
  const html = render(
    JSON.stringify({
      type: "doc",
      content: [
        { type: "image", attrs: { src: "javascript:alert(1)" } },
        { type: "image", attrs: { src: "https://x.test/a.jpg", alt: "وصف", width: 800, height: 400 } },
      ],
    }),
  )
  assert.ok(!html.includes("javascript:"))
  assert.match(html, /<img src="https:\/\/x\.test\/a\.jpg" alt="وصف" width="800" height="400" loading="lazy"/)
})

test("image caption renders a figure; alignment is applied; lists/quotes get an explicit direction", () => {
  const html = rendered.captioned
  assert.match(html, /<figure[^>]*><img[^>]*margin-inline:auto[^>]*\/><figcaption dir="rtl">تعليق الصورة<\/figcaption><\/figure>/)
  assert.match(html, /<ul dir="rtl"><li dir="rtl">/)
  assert.match(html, /<ul dir="ltr"><li dir="ltr">/)
})
