import assert from "node:assert/strict"
import { test } from "node:test"

import { contentHashKey, sniffImage, validateImageBytes } from "../../lib/upload-sniff"
import {
  MAX_BODY_JSON_BYTES,
  isSafeHref,
  isSafeImageSrc,
  sanitizeTiptapBody,
} from "../../lib/tiptap-sanitize"

const pad = (...b: number[]) => Uint8Array.from([...b, ...new Array(16).fill(0)])
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))

test("sniffImage detects supported formats from magic bytes", () => {
  assert.equal(sniffImage(pad(0xff, 0xd8, 0xff, 0xe0))?.contentType, "image/jpeg")
  assert.equal(sniffImage(pad(0x89, ...ascii("PNG"), 0x0d, 0x0a, 0x1a, 0x0a))?.ext, "png")
  assert.equal(sniffImage(pad(...ascii("GIF89a")))?.ext, "gif")
  assert.equal(sniffImage(pad(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")))?.contentType, "image/webp")
  assert.equal(sniffImage(pad(0, 0, 0, 0x20, ...ascii("ftypavif")))?.contentType, "image/avif")
})

test("sniffImage rejects SVG, HTML, text, truncated and ftyp non-avif", () => {
  const enc = (s: string) => new TextEncoder().encode(s)
  assert.equal(sniffImage(enc('<svg xmlns="http://www.w3.org/2000/svg"><script>1</script></svg>')), null)
  assert.equal(sniffImage(enc("<!doctype html><script>alert(1)</script>")), null)
  assert.equal(sniffImage(enc("GIF89")), null)
  assert.equal(sniffImage(pad(0, 0, 0, 0x20, ...ascii("ftypmp42"))), null)
  assert.equal(sniffImage(pad(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WAVE"))), null)
})

test("validateImageBytes enforces emptiness, size and type", () => {
  assert.deepEqual(validateImageBytes(new Uint8Array(0)), { ok: false, reason: "empty" })
  assert.deepEqual(validateImageBytes(pad(0xff, 0xd8, 0xff), 10), { ok: false, reason: "too_big" })
  assert.deepEqual(validateImageBytes(pad(1, 2, 3, 4)), { ok: false, reason: "type" })
  assert.equal(validateImageBytes(pad(0xff, 0xd8, 0xff)).ok, true)
})

test("contentHashKey is deterministic and content-addressed", async () => {
  const a = await contentHashKey("articles/x/cover/", pad(1, 2), "png")
  assert.equal(a, await contentHashKey("articles/x/cover", pad(1, 2), "png"))
  assert.notEqual(a, await contentHashKey("articles/x/cover", pad(1, 3), "png"))
  assert.match(a, /^articles\/x\/cover\/[0-9a-f]{32}\.png$/)
})

test("isSafeHref allowlists schemes, including obfuscated javascript:", () => {
  for (const ok of ["https://a.b", "http://a.b", "mailto:a@b.c", "tel:+1", "/x", "#top"]) assert.ok(isSafeHref(ok), ok)
  for (const bad of ["javascript:alert(1)", " JaVa\nScRiPt:alert(1)", "data:text/html,x", "//evil.com", "vbscript:x", 5, null])
    assert.ok(!isSafeHref(bad), String(bad))
})

test("isSafeImageSrc rejects data: and javascript:", () => {
  assert.ok(isSafeImageSrc("https://x/y.png"))
  assert.ok(isSafeImageSrc("/uploads/a.png"))
  assert.ok(!isSafeImageSrc("data:image/svg+xml;base64,AAA"))
  assert.ok(!isSafeImageSrc("//evil/x.png"))
})

test("sanitizeTiptapBody strips bad links, drops data: images, keeps the rest", () => {
  const doc = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "hi", marks: [{ type: "bold" }, { type: "link", attrs: { href: "javascript:alert(1)" } }] },
          { type: "text", text: "ok", marks: [{ type: "link", attrs: { href: "https://a.b" } }] },
        ],
      },
      { type: "image", attrs: { src: "data:image/png;base64,AAAA" } },
      { type: "image", attrs: { src: "https://r2/x.png" } },
    ],
  }
  const r = sanitizeTiptapBody(JSON.stringify(doc))
  assert.ok(r.ok)
  const out = JSON.parse(r.json)
  assert.deepEqual(out.content[0].content[0].marks, [{ type: "bold" }])
  assert.equal(out.content[0].content[1].marks.length, 1)
  assert.equal(out.content.length, 2)
  assert.equal(out.content[1].attrs.src, "https://r2/x.png")
})

test("sanitizeTiptapBody rejects oversized, malformed and non-doc input; passes empty", () => {
  assert.deepEqual(sanitizeTiptapBody("  "), { ok: true, json: "" })
  assert.deepEqual(sanitizeTiptapBody("{nope"), { ok: false, reason: "parse" })
  assert.deepEqual(sanitizeTiptapBody('{"type":"paragraph"}'), { ok: false, reason: "shape" })
  assert.deepEqual(sanitizeTiptapBody("[]"), { ok: false, reason: "shape" })
  const big = JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x".repeat(MAX_BODY_JSON_BYTES) }] }] })
  assert.deepEqual(sanitizeTiptapBody(big), { ok: false, reason: "size" })
})
