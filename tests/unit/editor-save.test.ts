import assert from "node:assert/strict"
import { test } from "node:test"

import { buildArticleSnapshot } from "../../lib/article-snapshot"
import { createDirtyDebouncer, type TimerApi } from "../../lib/editor-debounce"
import {
  classifyDraft,
  clearDraft,
  readDraft,
  writeDraft,
} from "../../lib/editor-draft"
import { internalNavTarget } from "../../lib/editor-nav-guard"
import { createSaveController, type SaveResult } from "../../lib/editor-save-controller"

/** Manual clock: timers fire only when `advance` is called. */
function fakeTimers() {
  let now = 0
  let nextId = 1
  const pending = new Map<number, { at: number; fn: () => void }>()
  const api: TimerApi = {
    setTimeout: (fn, ms) => {
      const id = nextId++
      pending.set(id, { at: now + ms, fn })
      return id
    },
    clearTimeout: (id) => void pending.delete(id as number),
  }
  return {
    api,
    async advance(ms: number) {
      const target = now + ms
      for (;;) {
        const due = [...pending.entries()]
          .filter(([, t]) => t.at <= target)
          .sort((a, b) => a[1].at - b[1].at)[0]
        if (!due) break
        pending.delete(due[0])
        now = due[1].at
        due[1].fn()
        await new Promise((r) => setImmediate(r))
      }
      now = target
    },
    pendingCount: () => pending.size,
  }
}

test("dirty debouncer: O(1) marks, one trailing run, flush runs immediately", async () => {
  const t = fakeTimers()
  let runs = 0
  const d = createDirtyDebouncer(() => runs++, 400, t.api)
  d.markDirty()
  await t.advance(200)
  d.markDirty()
  await t.advance(300)
  assert.equal(runs, 0)
  await t.advance(200)
  assert.equal(runs, 1)
  d.flush()
  assert.equal(runs, 1, "flush when clean is a no-op")
  d.markDirty()
  d.flush()
  assert.equal(runs, 2)
  assert.equal(d.isDirty(), false)
  d.markDirty()
  d.cancel()
  await t.advance(1000)
  assert.equal(runs, 2)
})

function makeController(opts: {
  save: (v: { n: number }) => Promise<SaveResult>
  timers: TimerApi
  retryDelaysMs?: number[]
}) {
  const state = { n: 0 }
  const statuses: string[] = []
  const c = createSaveController<{ n: number }>({
    getValue: () => ({ n: state.n }),
    serialize: (v) => String(v.n),
    save: opts.save,
    initialSnapshot: "0",
    debounceMs: 1000,
    retryDelaysMs: opts.retryDelaysMs ?? [2000, 5000],
    timers: opts.timers,
    onStatus: (s) => statuses.push(s),
  })
  return { state, statuses, c }
}

test("save controller: debounces and saves the latest value once", async () => {
  const t = fakeTimers()
  const sent: number[] = []
  const { state, c } = makeController({
    timers: t.api,
    save: async (v) => (sent.push(v.n), { ok: true }),
  })
  state.n = 1
  c.markDirty()
  state.n = 2
  c.markDirty()
  await t.advance(999)
  assert.deepEqual(sent, [])
  await t.advance(2)
  assert.deepEqual(sent, [2])
  assert.equal(c.hasUnsaved(), false)
})

test("save controller: edits during an in-flight save are NOT marked saved", async () => {
  const t = fakeTimers()
  const sent: number[] = []
  let release!: () => void
  const gate = new Promise<void>((r) => (release = r))
  const { state, c } = makeController({
    timers: t.api,
    save: async (v) => {
      sent.push(v.n)
      if (sent.length === 1) await gate
      return { ok: true }
    },
  })
  state.n = 1
  c.markDirty()
  await t.advance(1000)
  assert.deepEqual(sent, [1])
  assert.equal(c.getStatus().status, "saving")
  state.n = 2 // typed while the request is in flight
  c.markDirty()
  assert.equal(c.hasUnsaved(), true)
  release()
  await new Promise((r) => setImmediate(r))
  await new Promise((r) => setImmediate(r))
  assert.equal(c.getStatus().status, "pending", "newer content must not be shown as saved")
  await t.advance(1)
  assert.deepEqual(sent, [1, 2])
  assert.equal(c.hasUnsaved(), false)
})

test("save controller: thrown errors retry with backoff, then recover", async () => {
  const t = fakeTimers()
  let calls = 0
  const { state, c } = makeController({
    timers: t.api,
    save: async () => {
      calls++
      if (calls < 3) throw new Error("offline")
      return { ok: true }
    },
  })
  state.n = 1
  c.markDirty()
  await t.advance(1000)
  assert.equal(calls, 1)
  assert.equal(c.getStatus().status, "error")
  assert.equal(c.hasUnsaved(), true)
  await t.advance(1999)
  assert.equal(calls, 1)
  await t.advance(2)
  assert.equal(calls, 2)
  await t.advance(5000)
  assert.equal(calls, 3)
  assert.equal(c.getStatus().status, "saved")
})

test("save controller: non-retryable errors wait for the next edit; conflict stops saving", async () => {
  const t = fakeTimers()
  let calls = 0
  let mode: "invalid" | "conflict" = "invalid"
  const { state, c } = makeController({
    timers: t.api,
    save: async () => {
      calls++
      return mode === "invalid"
        ? { ok: false, error: "bad", retryable: false }
        : { ok: false, error: "conflict", conflict: true }
    },
  })
  state.n = 1
  c.markDirty()
  await t.advance(1000)
  await t.advance(60_000)
  assert.equal(calls, 1, "no retry for validation failures")
  mode = "conflict"
  state.n = 2
  c.markDirty()
  await t.advance(1000)
  assert.equal(c.getStatus().status, "conflict")
  state.n = 3
  c.markDirty()
  await t.advance(60_000)
  assert.equal(calls, 2, "no more saves after a conflict")
  assert.equal(await c.flush(), false)
})

test("save controller: flush saves immediately and reports success", async () => {
  const t = fakeTimers()
  const sent: number[] = []
  const { state, c } = makeController({
    timers: t.api,
    save: async (v) => (sent.push(v.n), { ok: true }),
  })
  state.n = 7
  c.markDirty()
  assert.equal(await c.flush(), true)
  assert.deepEqual(sent, [7])
  assert.equal(t.pendingCount(), 0)
})

test("snapshot ignores whitespace-only title edits and category order", () => {
  const base = {
    title: "a",
    excerpt: "b",
    categoryIds: ["2", "1"],
    isPublished: false,
    isMemberOnly: false,
    bodyJson: "",
  }
  assert.equal(
    buildArticleSnapshot(base),
    buildArticleSnapshot({ ...base, title: " a ", categoryIds: ["1", "2", "1"] }),
  )
  assert.notEqual(buildArticleSnapshot(base), buildArticleSnapshot({ ...base, isPublished: true }))
})

function memoryStorage(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  }
}

const draftBase = {
  baseUpdatedAt: 1000,
  title: "t",
  excerpt: "e",
  categoryIds: ["c"],
  isPublished: false,
  isMemberOnly: false,
  bodyJson: "{}",
}

test("draft backup round-trips, validates, clears, and survives broken storage", () => {
  const s = memoryStorage()
  assert.equal(writeDraft("a1", draftBase, s, () => 5), true)
  const d = readDraft("a1", s)
  assert.equal(d?.savedAt, 5)
  assert.equal(d?.title, "t")
  clearDraft("a1", s)
  assert.equal(readDraft("a1", s), null)

  assert.equal(readDraft("a1", memoryStorage({ "news-app:article-draft:a1": "{not json" })), null)
  assert.equal(readDraft("a1", memoryStorage({ "news-app:article-draft:a1": '{"v":2}' })), null)

  const broken = {
    getItem: () => {
      throw new Error("denied")
    },
    setItem: () => {
      throw new Error("quota")
    },
    removeItem: () => {
      throw new Error("denied")
    },
  }
  assert.equal(writeDraft("a1", draftBase, broken), false)
  assert.equal(readDraft("a1", broken), null)
  assert.doesNotThrow(() => clearDraft("a1", broken))
  assert.equal(writeDraft("a1", draftBase, null), false)
})

test("classifyDraft: none / restore / stale", () => {
  const s = memoryStorage()
  writeDraft("a", draftBase, s)
  const d = readDraft("a", s)
  assert.equal(classifyDraft(null, "x", null, null), "none")
  assert.equal(classifyDraft(d, "same", "same", 1000), "none")
  assert.equal(classifyDraft(d, "server", "draft", 1000), "restore")
  assert.equal(classifyDraft(d, "server", "draft", null), "restore")
  assert.equal(classifyDraft(d, "server", "draft", 2000), "stale")
})

test("nav guard only intercepts plain same-origin page changes", () => {
  const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false }
  const here = "https://x.test/admin/articles/1"
  assert.equal(internalNavTarget({ href: "https://x.test/admin/articles?a=1#h" }, click, here), "/admin/articles?a=1#h")
  assert.equal(internalNavTarget({ href: "/admin/articles" }, click, here), "/admin/articles")
  assert.equal(internalNavTarget({ href: "https://x.test/admin/articles/1#top" }, click, here), null)
  assert.equal(internalNavTarget({ href: "https://other.test/" }, click, here), null)
  assert.equal(internalNavTarget({ href: "/a", target: "_blank" }, click, here), null)
  assert.equal(internalNavTarget({ href: "/a", hasDownload: true }, click, here), null)
  assert.equal(internalNavTarget({ href: "/a" }, { ...click, ctrlKey: true }, here), null)
  assert.equal(internalNavTarget({ href: "/a" }, { ...click, button: 1 }, here), null)
})
