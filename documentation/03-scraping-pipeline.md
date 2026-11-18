# Scraping & Clustering Pipeline

## Scheduler

Driven by a separate Worker, [`news_workers`](../news_workers), deployed as **`news-latest`** (service binding
`NEWS_SITE` → `news-site`). It has **no public `fetch` handler** and sends `Authorization: Bearer $CRON_SECRET`
on every call (the site's `/api/cron/*` also accepts a logged-in admin). Three cron triggers, each one bounded step:

| Cron | Step | Budget |
|---|---|---|
| `*/10 * * * *` | `write` (≤4 articles/updates) → `health` (→ `update-price-rates` every 30 min) | 200 s |
| `3-59/10 * * * *` | `cluster` | 150 s |
| `6-59/10 * * * *` | `scrape` of a rotating slice: source *i* belongs to slot `i % 6` (≤2 sources per tick, each source once an hour) | 2 × 90 s |

Every step awaits its work (no un-awaited background continuation), runs under a **lease** (`pipeline_state`,
`lease:<step>`, TTL = budget + 60 s) so overlapping ticks answer `busy` instead of doing double work, derives every
LLM timeout from the remaining budget, logs **one JSON line** and records a `pipeline_runs` row (shown by
`/api/cron/health`). Claims on rows/topics go stale after 20 min (> worst-case run). Kill switch:
`INSERT OR REPLACE INTO pipeline_state (key,value) VALUES ('paused','1')` pauses clustering LLM work and writing.
Cloudflare limits used: cron wall time 15 min, 30 s CPU (the scheduler only awaits), 1000 service-binding subrequests;
no Queues/KV/DO.

## Sources

Defined in [`lib/news-scraper.ts`](../lib/news-scraper.ts). Eleven keys: `rt`, `independent`, `skynews`, `youm7`,
`bbc`, `alaraby`, `elwatan`, `alquds`, `shabiba`, `addustour`, `aawsat`.

> **`alhurra` was removed**: it sits behind a Cloudflare bot challenge (HTTP 403 for every URL incl. RSS) and cannot be scraped with plain HTTP.
> **`skynews`** was returning 0 items because its markup lost the JSON-LD list; the parser now falls back to plain
> article links (fixed).

## Scrape (`GET /api/cron/scrape-source/[key]`)

1. Load the source (404 if missing, skip if disabled).
2. Per supported category: fetch the listing, **drop URLs already stored** (indexed `findKnownUrls`) *before* fetching article bodies, fetch up to 10 new bodies.
3. `insertScrapedNewsRows`: canonicalize URL (string-based — strips fragments/tracking params, lower-cases host, **never re-encodes**; 49% of stored URLs contain Arabic), imageless items are **kept** (an image is only required at write time, from any outlet of the topic), insert with `status='pending'`, `content_len` and a parsed `published_ts`. An **unparseable date is not "now"**: `published_ts` NULL, `date_unknown=1`, `status='skipped'` (never clustered or written). The unique index `(source_key, url)` makes races harmless (`ON CONFLICT DO NOTHING`).
4. All fetches go through `safeFetch` (10 s timeout, host allow-list re-checked on each of ≤3 redirects, 3 MB body cap); article bodies use `Promise.allSettled`. One failing category no longer aborts the source; `lastScrapedAt` only advances if at least one category worked.

Clustering is **not** run here any more. Publish dates come in many formats (ISO, `+0300`, Arabic-Indic digits,
`سبت, 08/01/2026 - 07:30`, `9/8/2026 9:30:50 AM`); [`lib/published-ts.ts`](../lib/published-ts.ts) parses them all (Arabia UTC+3 when no zone).

## Clustering (`GET /api/cron/cluster` → `lib/clustering/run.ts`)

Chosen after benchmarking 11 methods on 162 hand-labelled real articles (F1: **signature blocking + LLM 0.90**,
TF-IDF + LLM verify 0.80, old production logic 0.53, keyword/n-gram matching ≈0.5). Per run (max 40 rows, **newest first**):

1. **Claim** `pending` rows atomically (`status='clustering'`, `claimed_at`); stale claims (>20 min) are released; rows older than 72h become `skipped`.
2. **Signature** (LLM, batches of 5, 4 in parallel): domain/type, actors, named things, storyline, places, countries (ISO), event date, stage, content type, category, keywords — labels and short names only, no sentences. Validated in `parseSignature` (enums repaired, far-off dates replaced by publish date, invalid countries dropped). Stored in `scraped_news.signature`, so a later retry never pays for extraction twice. Third failure → programmatic fallback signature. **A usage-limit/budget/deadline error is not a failure of the row**: the run stops, rows go back to `pending`, no attempt is counted, no fallback signature or singleton topic is created.
3. **Blocking** (`blocking.ts`, no LLM): articles are linked when within ±1 event day, same content type, share a country (if both have any) and share an actor / named thing / ≥25% keywords. Connected components = blocks (max 35 items; topics count once).
4. **Judge** (LLM, one call per block containing a new article): sees the block's existing topics (3 sample titles each) and the new articles; returns groups. Output is validated (`validateGroups`); an existing topic is ONE event, reactions/follow-ups by other parties are separate. Judge failure → rows return to `pending` (attempts+1); third failure → they stay separate topics.
5. **Persist**: new topics (title = first article's title, category = majority of signature categories, fallback source mapping), attach to existing topics, then **recompute** `article_count` / `last_seen_at` from real rows (never `+= n`).
6. **Merge pass** (`merge.ts`, no LLM): recent topics without a published article whose *event key* (actors incl. spelling variants such as نتنياهو/نتانياهو + concrete event type + stage + day + country) matches another topic are merged into it (`skip_reason='merged:<id>'`).
7. Topics still without a category are classified by title; empty stale topics are pruned.

Row states: `pending → clustering → clustered` (or `skipped` / `failed`). Without an API key nothing is merged (every article its own topic).

## Migrations for this pipeline

`0015_pipeline_state` (row/topic state columns, unique `(source_key,url)`, indexes, backfill), `0016_cleanup_topics`
(recompute counts, delete empty topics), `0017_scraped_news_signature`, `0018_pipeline_hardening` (tables `pipeline_state`, `pipeline_runs`, additive columns, partial indexes, a tiny 72h `content_len` backfill). Apply in order — see [08](./08-deployment-and-operations.md).
