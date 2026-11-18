# 09 - Editor notes (Tiptap article writer + /api/ai)

## Save flow
- `components/create-article-form.tsx` owns the form; the body is NOT React state. `SimpleEditor` fires an
  O(1) `onDirty()` per document-changing transaction (`transaction.docChanged`) and a 400ms trailing
  `onContentChange(json)`; the form only calls `editor.getJSON()` when a save or draft write really happens.
- `lib/editor-save-controller.ts` (unit tested) is the state machine: debounce 1.5s -> save -> `saved`.
  Edits arriving during an in-flight save bump a version; after success the controller sees the version
  moved, does NOT mark it saved and saves again. Thrown errors / retryable failures retry with backoff
  (2s, 5s, 15s, 30s); validation failures (`{ok:false}` from the action) wait for the next edit; a
  `conflict` result stops autosave and shows a banner. `online` event retries immediately.
- Local backup: `lib/editor-draft.ts` writes `localStorage["news-app:article-draft:<id>"]` (debounced 800ms,
  before every network attempt, and synchronously on hide/unload). Cleared after a save with nothing newer.
  On load a differing draft triggers a restore/discard banner ("stale" variant if the server copy is newer).
- Leaving: `beforeunload` prompt while unsaved; capture-phase click guard on in-app links
  (`lib/editor-nav-guard.ts`) flushes, then `router.push`, or asks to confirm if the save failed.
  Back button (`popstate`), `pagehide`, `visibilitychange: hidden` and unmount do a best-effort flush.
  A server action started during page teardown is usually cancelled by the browser: the synchronous
  localStorage draft is the real safety net (server actions cannot use `sendBeacon`).
- Editor lifecycle: `useEditor(..., [articleId])` - created once, content applied only at creation.
  Parent callbacks are read through refs.

### Server change still required (optimistic concurrency)
The client already sends `expectedUpdatedAt` (the loaded `updatedAt`, ISO string or ms) with
`updateArticleAction`, but the action ignores it and the page does not pass `initialUpdatedAt`. Needed:
1. `app/admin/articles/[id]/page.tsx`: pass `initialUpdatedAt={row.updatedAt.toISOString()}` to `CreateArticleForm`.
2. `UpdateArticleInput`: add `expectedUpdatedAt?: string | number | null`. Before the UPDATE, compare to the
   row's `updatedAt` (ms); on mismatch return `{ ok: false, code: "conflict", error: "تم تعديل المقال من مكان آخر." }`.
3. On success return `{ ok: true, updatedAt: <new Date ms or ISO> }` (client stores it as the next token).
   Ideally do the compare inside the UPDATE's WHERE clause to avoid a race.

## AI flow
- Client: `lib/editor-inline-opencode.ts` resolvers -> `POST /api/ai`. Errors are thrown (never swallowed);
  `Ai.onError` in `simple-editor.tsx` resets the AI UI state and shows a notice bar; `AbortError` = clean cancel.
  The Tiptap Cloud appId/token are no longer used (our resolvers replace the cloud calls).
- Server: `app/api/ai/route.ts` requires admin, caps body (200KB) and field lengths, per-user rate limit
  (20/min, in-isolate best effort), forwards `request.signal` + 120s timeout upstream, `max_tokens: 4096`,
  `reasoning_effort: "low"` (accepted by the provider; effectiveness not measured), and cancels the upstream
  reader if the client goes away. Upstream 401/402/429/5xx map to distinct statuses with short Arabic JSON
  `{error, message}`; upstream bodies are never forwarded (status only is logged).
- Wire format on success: plain text stream with two in-band control chars stripped by
  `lib/ai-stream.ts#createCleanAiStream`: U+0000 = "still thinking" keep-alive (shows "يفكّر..."),
  U+0001 = truncated (`finish_reason: length`). A stream with no visible text errors with an Arabic message.
- `ai-prompt-dock.tsx` shares the helpers and aborts on close/unmount (it still replaces the whole document
  with the result; undo restores it).

## RTL decisions
- Editor root `dir="rtl" lang="ar"`; text blocks and list items get `dir="auto"` as ProseMirror decorations
  (`lib/tiptap-article-rtl.ts`), not document attributes - core's `textDirection` option would write a `dir`
  attr into every node of the stored JSON.
- `TextAlign` default `right`; CSS default is `text-align: start`, so English paragraphs sit left and Arabic
  right unless the toolbar sets an explicit alignment. Lists/blockquote/task lists use logical properties.
- Typography: quote, fraction, multiplication and superscript rules disabled (English-only); ellipsis/dashes kept.
- Code blocks stay LTR. `code`/links are bidi-isolated so Latin/number runs do not reorder punctuation.
- Not covered: the editor has no Table extension in the article pack, so table RTL is untouched; `paragraph-node.scss`
  indent uses `margin-left` (indent feature not exposed in the toolbar).

## Images
- `Image` has `allowBase64: false`; pasted `<img src="data:/blob:/file:">` is stripped with a notice.
- Pasted/dropped image files upload through `uploadArticleInlineImageAction` (`lib/tiptap-image-paste.ts`);
  5MB client limit with Arabic errors; oversized-body/network errors from the action are mapped by
  `describeUploadError`. No fake progress is reported (the bar jumps to 100% on completion).
- Pasted external `http(s)` images are kept as remote URLs (not re-hosted).

## Manual browser checklist
1. Typing latency: paste ~5k words; type continuously - no stutter; DevTools Performance shows no `getJSON`
   per key; status shows "جارٍ الحفظ تلقائياً" ~1.5s after you stop.
2. Tab close: type, immediately close tab -> browser asks to confirm; reopen the article -> restore banner
   appears if the last save did not land; "استعادة" brings text back.
3. In-app nav: type, click the admin sidebar link quickly -> page waits for the save, then navigates.
4. Offline: DevTools -> Offline, type -> "تعذر حفظ"/error + retry link; go online -> saves automatically.
5. Two tabs on one article: after the server change above, save in tab A then B -> B shows the conflict banner.
6. AI: select text -> AI menu -> run; first output may take seconds ("يفكّر..."); press Esc mid-way (no error,
   UI resets); stop the dev key / break network (error notice, UI not stuck loading); very long prompt -> 413 message.
7. RTL: type Arabic paragraph, English paragraph, mixed with numbers; bullet/ordered/task lists (markers on
   the correct side per paragraph language); blockquote bar on the start edge; alignment buttons; `"` stays straight.
8. Images: paste a screenshot (uploads, inserts), paste from a web page with an inline image (stripped + notice),
   drop a 6MB image (Arabic size error).
