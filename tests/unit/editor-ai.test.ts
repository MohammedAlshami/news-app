import assert from "node:assert/strict"
import { test } from "node:test"

import {
  AI_EMPTY_MESSAGE,
  AI_THINKING_MARK,
  AI_TRUNCATED_MARK,
  AiRequestError,
  aiErrorMessage,
  createCleanAiStream,
  createRateLimiter,
  describeAiHttpError,
  isAbortError,
  mapUpstreamStatus,
  parseSseChunk,
  parseSseDelta,
  stripAiControlMarks,
} from "../../lib/ai-stream"
import {
  describeUploadError,
  IMAGE_MESSAGES,
  stripInlineImages,
  validateImageFile,
} from "../../lib/tiptap-image-utils"

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  return new ReadableStream({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch))
      c.close()
    },
  })
}
async function readAll(s: ReadableStream<Uint8Array>) {
  const r = s.getReader()
  const dec = new TextDecoder()
  let out = ""
  for (;;) {
    const { value, done } = await r.read()
    if (done) return out
    out += dec.decode(value, { stream: true })
  }
}

test("parseSseChunk handles lines split across chunks and [DONE]", () => {
  let r = parseSseChunk("", 'data: {"a":1}\ndata: {"b"')
  assert.deepEqual(r.payloads, ['{"a":1}'])
  r = parseSseChunk(r.rest, ':2}\n\ndata: [DONE]\n: comment\n')
  assert.deepEqual(r.payloads, ['{"b":2}'])
  assert.equal(r.rest, "")
})

test("parseSseDelta reads content, reasoning and finish_reason", () => {
  assert.deepEqual(parseSseDelta('{"choices":[{"delta":{"content":"مرحبا"}}]}'), {
    content: "مرحبا",
    reasoning: "",
    finishReason: null,
  })
  assert.equal(parseSseDelta('{"choices":[{"delta":{"reasoning_content":"hm"}}]}')?.reasoning, "hm")
  assert.equal(parseSseDelta('{"choices":[{"delta":{},"finish_reason":"length"}]}')?.finishReason, "length")
  assert.equal(parseSseDelta("not json"), null)
  assert.equal(parseSseDelta('{"choices":[]}')?.content, "")
})

test("mapUpstreamStatus never leaks upstream details and maps distinct statuses", () => {
  assert.equal(mapUpstreamStatus(401).code, "ai_auth")
  assert.equal(mapUpstreamStatus(402).status, 402)
  assert.equal(mapUpstreamStatus(429).status, 429)
  assert.ok(mapUpstreamStatus(429).retryAfter)
  assert.equal(mapUpstreamStatus(503).code, "ai_unavailable")
  assert.equal(mapUpstreamStatus(504).code, "ai_timeout")
  assert.equal(mapUpstreamStatus(418).code, "ai_failed")
  for (const s of [401, 402, 429, 500]) assert.match(mapUpstreamStatus(s).message, /[؀-ۿ]/)
})

test("describeAiHttpError prefers the server message, falls back by status", () => {
  assert.equal(describeAiHttpError(402, JSON.stringify({ error: "ai_quota", message: "نفد الرصيد" })), "نفد الرصيد")
  assert.match(describeAiHttpError(413, "<html>"), /أطول/)
  assert.match(describeAiHttpError(500, ""), /تعذر/)
})

test("error helpers", () => {
  assert.equal(isAbortError(new DOMException("x", "AbortError")), true)
  assert.equal(isAbortError(new Error("x")), false)
  assert.equal(aiErrorMessage(new AiRequestError("رسالة")), "رسالة")
  assert.match(aiErrorMessage(new TypeError("Failed to fetch")), /الاتصال/)
})

test("stripAiControlMarks", () => {
  assert.deepEqual(stripAiControlMarks(`${AI_THINKING_MARK}مرحبا${AI_TRUNCATED_MARK}`), {
    text: "مرحبا",
    thinking: true,
    truncated: true,
  })
})

test("createCleanAiStream strips marks, reports thinking, keeps multibyte text intact", async () => {
  let thinking = 0
  const bytes = new TextEncoder().encode("نص")
  const enc = new TextEncoder()
  const split = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(enc.encode(AI_THINKING_MARK))
      c.enqueue(bytes.slice(0, 1)) // split a 2-byte Arabic letter across chunks
      c.enqueue(bytes.slice(1))
      c.close()
    },
  })
  const out = await readAll(createCleanAiStream(split, { onThinking: () => thinking++ }))
  assert.equal(out, "نص")
  assert.equal(thinking, 1)
})

test("createCleanAiStream errors when the model produced no visible text", async () => {
  await assert.rejects(readAll(createCleanAiStream(streamOf([AI_THINKING_MARK]))), (e: Error) => {
    return e instanceof AiRequestError && e.userMessage === AI_EMPTY_MESSAGE
  })
  await assert.rejects(
    readAll(createCleanAiStream(streamOf([AI_THINKING_MARK + AI_TRUNCATED_MARK]))),
    (e: Error) => e instanceof AiRequestError && /وقتاً طويلاً/.test(e.userMessage),
  )
})

test("createCleanAiStream propagates upstream failures and cancel", async () => {
  const failing = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new TextEncoder().encode("a"))
    },
    pull(c) {
      c.error(new Error("boom"))
    },
  })
  await assert.rejects(readAll(createCleanAiStream(failing)), /boom/)

  let cancelled = false
  const src = new ReadableStream<Uint8Array>({
    pull() {},
    cancel() {
      cancelled = true
    },
  })
  const clean = createCleanAiStream(src)
  await clean.cancel()
  assert.equal(cancelled, true)
})

test("rate limiter: fixed window", () => {
  let t = 0
  const rl = createRateLimiter(2, 1000, () => t)
  assert.equal(rl.check("u"), 0)
  assert.equal(rl.check("u"), 0)
  assert.ok(rl.check("u") > 0)
  assert.equal(rl.check("other"), 0)
  t = 1001
  assert.equal(rl.check("u"), 0)
})

test("image helpers: validation, inline-image stripping, upload errors", () => {
  assert.equal(validateImageFile({ size: 10, type: "image/png" }), null)
  assert.equal(validateImageFile({ size: 6 * 1024 * 1024, type: "image/png" }), IMAGE_MESSAGES.tooLarge)
  assert.equal(validateImageFile({ size: 1, type: "text/plain" }), IMAGE_MESSAGES.notImage)

  const html = '<p>a</p><img src="data:image/png;base64,AAA"><img alt="x" src=\'blob:http://x/1\'><img src="https://cdn/x.png">'
  const r = stripInlineImages(html)
  assert.equal(r.removed, 2)
  assert.equal(r.html, '<p>a</p><img src="https://cdn/x.png">')

  assert.equal(describeUploadError(new Error("Body exceeded 1 MB limit")), IMAGE_MESSAGES.tooLarge)
  assert.match(describeUploadError(new TypeError("Failed to fetch")), /الاتصال/)
  assert.equal(describeUploadError(new Error("المقال غير موجود.")), "المقال غير موجود.")
  assert.equal(describeUploadError(new Error("weird")), IMAGE_MESSAGES.uploadFailed)
})
