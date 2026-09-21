# Article Generation

All AI calls go through OpenRouter (`lib/llm-json.ts` → `openRouterJson`: JSON mode, timeout, one retry, **empty completions are treated as failures**).
Model: `OPENROUTER_MODEL` (default `deepseek/deepseek-v4-flash`, ~30 output tokens/s — output length dominates latency).

```
scraped_news (pending) ─cluster─► topics ─write-pipeline─► generated_articles + articles
```

Clustering is described in [03](./03-scraping-pipeline.md). This page covers writing.

## One generation loop (`lib/generation/core.ts`)

Used by `write-pipeline` (every 10 min, up to 4 articles, 2 parallel) and `batch-generate` (manual bulk, `?limit=`).

**Eligibility** (`listCandidates` + `isWritable`):
- category set; newest source ≤ **48h** old (stale news is never published); `gen_attempts < 3`;
- `open` topics with no generated article, stale `writing` claims (>15 min), or a **follow-up** (`written` topic with ≥3 new sources, ≥6h since its last article, fewer than 2 articles);
- at least one source with real text and an image; **2+ outlets**, or a single outlet that has waited 2h for a second one.

**Selection**: per-category queues (most outlets first, then newest), round-robin across categories that still have daily quota.

**Per topic** (`generateForCandidate`):
1. **Claim** atomically (compare-and-swap on status/claimed_at) — concurrent writers get `lost`.
2. Re-check the category quota after claiming.
3. Pre-check: near-duplicate of an article published in the last 72h (lexical cosine ≥0.6 on source titles) → topic `skipped`, **no LLM call**.
4. Sources: one per outlet first, plain text (Tiptap flattened, ≤3000 chars each), ≤5 sources; previous articles of the topic are passed for follow-ups.
5. Write (`WRITE_PROMPT`: facts only from sources, attribute outlets, skip if already covered), validate (`parseWriterOutput`: title/excerpt/≥3 paragraphs, summary-style paragraphs removed, source ids checked).
6. Post-check duplicate (title+excerpt cosine ≥0.5), upload cover (R2, dedup by hash), insert `generated_articles` then `articles`; if the second insert fails the first is rolled back.
7. Body ends with a **«المصادر»** line linking each outlet used (Arabic outlet names from `news_sources.name_ar`).
8. Topic → `written` (`written_source_count`), or on failure back to `open` with `gen_attempts+1` (3rd failure → `skipped`). Never left in `writing`.

## Daily quotas
`categories.daily_quota` (default 25; edited at `/admin/settings`), counted per UTC day from `generated_articles` joined to topics. Enforced when planning and again after claiming.

## Duplicate safety net
Topic-level grouping is done by the signature clustering. The lexical checks above (`lib/generation/dedupe.ts`, TF-IDF cosine) are only a last defence before publishing.

## Cost / speed
Per article ≈ one signature slot (1/5 of a call) + a share of one judge call + one writing call — a fraction of a cent. Signature extraction is the slow part (~70–100s per batch of 5 at 30 tok/s), hence the per-run cap and parallelism.
