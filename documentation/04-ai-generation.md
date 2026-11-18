# Article Generation

All LLM calls go through OpenCode **Go** (`lib/llm-json.ts` → `openCodeJson`, config in `lib/opencode.ts`, read lazily
per call because OpenNext fills `process.env` at runtime). Model `OPENCODE_MODEL` (default `deepseek-v4.1-flash`, a
reasoning model).

```
scraped_news ─cluster─► topics ─write step─► generated_articles + articles
```
Clustering is described in [03](./03-scraping-pipeline.md).

## LLM client
- Every call sends `max_tokens` and `thinking:{type:"disabled"}` (verified against the API: 0 reasoning tokens, ~3x cheaper;
  `reasoning_effort:"low"` barely helps). `OPENCODE_THINKING=on` re-enables low effort.
- Per-call timeout = min(requested, time left in the step); `deadlineAt` stops new calls. `finish_reason:"length"` → `LlmTruncatedError` (billed, never retried).
- Retries (jittered backoff, `Retry-After`): network errors, timeouts, 5xx, empty or unparseable completions. **Never** on 400/401/402/429.
  402/429/limit-bodies → `LlmQuotaError`, 401/403 → `LlmAuthError`: the tick **stops**, nothing is charged to the topic (`gen_attempts` untouched).
- Parse tolerance: fences / surrounding prose are stripped. Usage (prompt/completion/reasoning tokens, `opencode.allowance`) is reported per call.
- **Daily token budget** (`pipeline_state` key `llm_daily_token_budget`, default 3 000 000, counter `tokens:<UTC day>`): checked before each call.

## Topic lifecycle (`lib/generation/core.ts`)
`topics.written_source_count` is the **watermark**: sources already considered (written *or* judged). A topic is a candidate only if
`article_count > written_source_count`, so **a topic whose sources were all considered costs zero LLM calls on every later tick**.
Eligible: `open` topic without articles; stale `writing` claim (20 min); `written` topic with unseen sources, cooldown ≥ 4 h since its last article, < 3 articles,
newest source ≤ 48 h. Candidate listing is two LIMITed queries (topics only, then aggregates of those topics).

Per topic: **claim** (random `claim_token`, pre-claim status stored) → quota re-check (published today + in-flight claims; quota day = Arabia midnight) →
- **first article**: near-duplicate (title cosine, stable IDF) and **event-key match** against articles of the last 72 h (`event_sig`) → finished as `skipped`, no LLM.
- **update** (rule 2): new sources = the K newest unseen rows. Deterministic pre-filter (new outlet, ≥3 new rows, or ≥2 new figures) → else `unchanged`, no LLM.
  Then ONE small judge call (`{material,new_facts[]}`, 700 tokens). Not material → watermark advances, recorded (`skip_reason`), never re-judged until more sources arrive.
  Material → the writer gets mode `update`, the previous article and `newFacts`, must frame an update with a different title; the body gets an «اقرأ أيضا» link to the earlier article (`/news/<id>`).
- **cover first** (before any paid call): content-hashed R2 key, magic-byte validation, ≤6 MB, tries up to 4 images (all outlets), updates may reuse the earlier cover; no hot-linking.
- **write** (≤5000 tokens), `parseWriterOutput`, then **gates** (`quality.ts`): 3–8 paragraphs, Arabic ratio ≥0.7, no instruction/markup/URL/e-mail/phone not in sources, numbers and Latin names grounded in sources, quotes verbatim, 6-gram near-copy < 25 % (and no 25-word verbatim run), title ≠ source headline / previous title. A rejected output counts as a failed attempt (3 → skipped).
- **persist** = ONE `db.batch` (generated row + public article + topic status), both inserts conditional on the claim token **and** category quota, so a stale/overlapping writer inserts nothing (`lost`). Source links: http(s) only.

Each `generated_articles` row stores `kind` (original/update), `update_of`, `article_id`, `model`, `prompt_version` (`PROMPT_VERSION`), token usage, `event_sig`, `gate_flags` → bad batches can be queried and rolled back.
Publishing gate: single-outlet topics wait `single_source_wait_min` (default 120) for corroboration. Admin draft generation (`/api/cron/generate-articles?topicId=`) uses the same writer/gates (`generateDraftForTopic`, unpublished); the old `article-generator.ts` was removed.

## Settings (`pipeline_state`, plain SQL)
`paused`, `llm_daily_token_budget`, `single_source_wait_min`, `followup_cooldown_min`, `max_articles_per_topic`.

## Health
`/api/cron/health` (guarded): backlog, stuck claims, last run ages, tokens today vs budget, 24 h write stats from `pipeline_runs`
(skip/failure rate, runs stopped by a limit). Flags include `llm_quota_exhausted`, `token_budget_80pct`, `pipeline_paused`.

## Deploy order
1. Secrets: `CRON_SECRET` (≥16 chars, same value) on **both** Workers (`wrangler secret put CRON_SECRET` in the site dir and in `news_workers/`); `OPENCODE_API_KEY` on the site Worker.
2. Migrations (additive, safe for the running old code), in order: `wrangler d1 execute news-site --remote --file=db/migrations/0018_pipeline_hardening.sql`.
3. Deploy the site Worker, then `cd news_workers && wrangler deploy` (registers the 3 crons). Verify: `curl -i https://<site>/api/cron/health` → 401; with the bearer → 200.
