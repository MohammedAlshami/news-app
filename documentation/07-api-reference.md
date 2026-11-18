# API Reference

All routes are Next.js Route Handlers under `app/api/`. Base URL:
`https://news-site.mshami2021.workers.dev` (or `http://localhost:3002` locally).

> **Auth model:** every route is either *public read-only* (`/api/categories`, `/api/exchange-rate`; both
> send `Cache-Control: public, s-maxage=300, stale-while-revalidate`), *admin-only* (`requireAdminApi()`:
> 401 without a session, 403 for non-admins), or *cron* (`/api/cron/*`: `Authorization: Bearer $CRON_SECRET`,
> or an admin session for manual runs). `tests/unit/security-guards.test.ts` enforces this: a new route must
> call a guard or be added to the explicit public allowlist. Non-cron routes return generic error messages.

## Content & data

### `GET /api/categories` (public, cached)
Returns the list of site categories.

### `GET /api/topics` (admin)
Returns topics (`id`, `title`, `articleCount`) ordered by creation.

### `GET /api/topics/[id]/sources` (admin)
Scraped source articles attached to a topic (for admin modals).

### `GET /api/generated-articles/[id]` (admin)
A generated article with its source list.

### `GET /api/scraped-news/[id]` (admin)
A single scraped item (full content) for admin.

### `PATCH /api/admin/news-sources/[key]` (admin)
Body `{ isEnabled: boolean }`; enables/disables a scrape source.

### `GET /api/exchange-rate` (public, cached)
Currency conversion using `price_rates`.
Query: `from`, `to`, `amount`, `market` (`sanaa` | `aden` | `gold`).
`YER` is the pivot currency. Returns `{ base, quote, amount, rate, result, date, source }`.

## AI

### `POST /api/ai` (admin)
Streams AI text for the editor (inline edit / prompt dock).
Body: `{ prompt, title?, excerpt?, mode?, editorInline? }`.
Proxies to OpenCode (`deepseek-v4.1-flash`) and streams plain text.
Returns `500` if `OPENCODE_API_KEY` is unset, `502` on upstream failure.

## Cron / pipeline

> **Security:** `/api/cron/*` requires `Authorization: Bearer <CRON_SECRET>` (or an admin session). The `news-latest` scheduler must have the same `CRON_SECRET` secret.

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
