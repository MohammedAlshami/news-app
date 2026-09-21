# Scraping & Clustering Pipeline

## Scheduler

Driven by a separate Worker, [`news_workers`](../news_workers), deployed as **`news-latest`**
(service binding `NEWS_SITE` → `news-site`). Cron: **`*/10 * * * *`**.

| When | Steps (in order) |
|---|---|
| minute 0 (hourly) | scrape all 11 sources (5s stagger) → then the 10-minute steps |
| every 10 min | `cluster` → `write-pipeline` → `update-price-rates` → `health` |

Every step is idempotent, so retries and overlapping ticks are safe. Failures are logged with
`console.error` (visible in `wrangler tail` / Workers Logs); a `HEALTH ALERT` line is logged when
`/api/cron/health` returns 503. `news-site` itself has no cron triggers.

## Sources

Defined in [`lib/news-scraper.ts`](../lib/news-scraper.ts). Eleven keys: `rt`, `independent`, `skynews`, `youm7`,
`bbc`, `alaraby`, `elwatan`, `alquds`, `shabiba`, `addustour`, `aawsat`.

> **`alhurra` was removed**: it sits behind a Cloudflare bot challenge (HTTP 403 for every URL incl. RSS) and cannot be scraped with plain HTTP.
> **`skynews`** was returning 0 items because its markup lost the JSON-LD list; the parser now falls back to plain
> article links (fixed).

## Scrape (`GET /api/cron/scrape-source/[key]`)

1. Load the source (404 if missing, skip if disabled).
2. Per supported category: fetch the listing, **drop URLs already stored** (indexed `findKnownUrls`) *before* fetching article bodies, fetch up to 10 new bodies.
3. `insertScrapedNewsRows`: canonicalize URL (string-based — strips fragments/tracking params, lower-cases host, **never re-encodes**; 49% of stored URLs contain Arabic), drop items without an image, insert with `status='pending'` and a parsed `published_ts`. The unique index `(source_key, url)` makes races harmless (`ON CONFLICT DO NOTHING`).
4. One failing category no longer aborts the source; `lastScrapedAt` only advances if at least one category worked.

Clustering is **not** run here any more. Publish dates come in many formats (ISO, `+0300`, Arabic-Indic digits,
`سبت, 08/01/2026 - 07:30`, `9/8/2026 9:30:50 AM`); [`lib/published-ts.ts`](../lib/published-ts.ts) parses them all (Arabia UTC+3 when no zone).

## Clustering (`GET /api/cron/cluster` → `lib/clustering/run.ts`)

Chosen after benchmarking 11 methods on 162 hand-labelled real articles (F1: **signature blocking + LLM 0.90**,
TF-IDF + LLM verify 0.80, old production logic 0.53, keyword/n-gram matching ≈0.5). Per run (max 40 rows, **newest first**):

1. **Claim** `pending` rows atomically (`status='clustering'`, `claimed_at`); stale claims (>10 min) are released; rows older than 72h become `skipped`.
2. **Signature** (LLM, batches of 5, 4 in parallel): domain/type, actors, named things, storyline, places, countries (ISO), event date, stage, content type, category, keywords — labels and short names only, no sentences. Validated in `parseSignature` (enums repaired, far-off dates replaced by publish date, invalid countries dropped). Stored in `scraped_news.signature`, so a later retry never pays for extraction twice. Third failure → programmatic fallback signature.
3. **Blocking** (`blocking.ts`, no LLM): articles are linked when within ±1 event day, same content type, share a country (if both have any) and share an actor / named thing / ≥25% keywords. Connected components = blocks (max 35 items; topics count once).
4. **Judge** (LLM, one call per block containing a new article): sees the block's existing topics (3 sample titles each) and the new articles; returns groups. Output is validated (`validateGroups`); an existing topic is ONE event, reactions/follow-ups by other parties are separate. Judge failure → rows return to `pending` (attempts+1); third failure → they stay separate topics.
5. **Persist**: new topics (title = first article's title, category = majority of signature categories, fallback source mapping), attach to existing topics, then **recompute** `article_count` / `last_seen_at` from real rows (never `+= n`).
6. Topics still without a category are classified by title; empty stale topics are pruned.

Row states: `pending → clustering → clustered` (or `skipped` / `failed`). Without an API key nothing is merged (every article its own topic).

## Migrations for this pipeline

`0015_pipeline_state` (row/topic state columns, unique `(source_key,url)`, indexes, backfill), `0016_cleanup_topics`
(recompute counts, delete empty topics), `0017_scraped_news_signature`. Apply in order — see [08](./08-deployment-and-operations.md).
