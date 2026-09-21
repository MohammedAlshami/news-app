# API Reference

All routes are Next.js Route Handlers under `app/api/`. Base URL:
`https://news-site.mshami2021.workers.dev` (or `http://localhost:3002` locally).

> **Security:** the `/api/cron/*` endpoints are **unauthenticated**. They are intended to be
> called by the `news-latest` scheduler worker (service binding) but are publicly reachable.
> Consider gating them (shared secret / Cloudflare Access) if that matters.

## Content & data

### `GET /api/categories`
Returns the list of site categories.

### `GET /api/topics`
Returns topics (`id`, `title`, `articleCount`) ordered by creation.

### `GET /api/topics/[id]/sources`
Scraped source articles attached to a topic (for admin modals).

### `GET /api/generated-articles/[id]`
A generated article with its source list.

### `GET /api/scraped-news/[id]`
A single scraped item (full content) for admin.

### `GET /api/admin/news-sources/[key]`
Source detail for the admin.

### `GET /api/exchange-rate`
Currency conversion using `price_rates`.
Query: `from`, `to`, `amount`, `market` (`sanaa` | `aden` | `gold`).
`YER` is the pivot currency. Returns `{ base, quote, amount, rate, result, date, source }`.

## AI

### `POST /api/ai`
Streams AI text for the editor (inline edit / prompt dock).
Body: `{ prompt, title?, excerpt?, mode?, editorInline? }`.
Proxies to OpenRouter (`deepseek/deepseek-v4-flash`) and streams plain text.
Returns `500` if `OPENROUTER_API_KEY` is unset, `502` on upstream failure.

## Cron / pipeline

> **Security:** `/api/cron/*` is **unauthenticated** (intended for the `news-latest` service binding but publicly reachable). Gate it (shared secret / Cloudflare Access) if that matters.

### `GET /api/cron/scrape-source/[key]`
Scrape one source (known URLs skipped before fetching bodies), insert new rows as `pending`. Returns `{ results[], totalInserted, failedCategories }`. Does **not** cluster.

### `GET /api/cron/cluster`
Runs `runClustering` (max 40 pending rows, newest first). Returns the run stats: `claimed, extracted, extractionFailed, fallbackSignatures, blocks, blocksJudged, blockJudgeFailed, newTopics, attachedToExisting, classified, prunedEmptyTopics, …`. 500 with `{ok:false,error}` on failure.

### `GET /api/cron/write-pipeline`
SSE. Shared generation loop, up to 4 articles. Events: `start`, `written` | `skipped`, `error`, `complete` (with summary). Timeout 200s.

### `GET /api/cron/batch-generate`
SSE, manual bulk generation: same loop, `?limit=N` (default 60), concurrency 4. Events: `plan`, `generating`, `generated`, `skipped`, `error`, `complete`.

### `GET /api/cron/health`
JSON counters (`pendingRows`, `oldestPendingAgeMin`, `lastScrapeAgeMin`, `lastTopicAgeMin`, `lastArticleAgeMin`, `articlesLast24h`, `stuckWriting`, `flags[]`). **200** when healthy, **503** with flags (`scraping_stalled`, `clustering_backlog`, `no_new_topics_4h`, `no_articles_4h`, `stuck_writing_topics`).

### `GET /api/cron/generate-articles`
Admin/testing: generates an unpublished draft for a topic via the standalone generator (`?topicId=`, `?limit=`).

### `GET /api/cron/update-price-rates`
Scrapes `2dec.net` rates into `price_rates` (`sanaa`, `aden`, `gold`).

## Calling from the scheduler

```
scrape-source/[key] (hourly, all 11, staggered) → cluster → write-pipeline → update-price-rates → health
```
