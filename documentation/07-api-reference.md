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

### `GET /api/cron/scrape-source/[key]`
Scrape one source across its categories, insert new items, update `lastScrapedAt`, then run
topic grouping. Returns a JSON summary (`results[]`, `totalInserted`, `topicsGrouped`).
See [03-scraping-pipeline.md](./03-scraping-pipeline.md).

### `GET /api/cron/scrape-news`
Scrape all enabled sources. Query: `category?`, `limit?`. Returns a JSON summary.

### `GET /api/cron/batch-generate`
SSE stream. Query: `limit` (default 60). Classifies uncategorized topics, then generates
articles round-robin across categories within each category's daily quota.
Events: `classify`, `plan`, `generating`, `generated`, `skipped`, `error`, `complete`.

### `GET /api/cron/write-pipeline`
SSE stream. Runs `runWriter()` (one article) with a 120s timeout.
Events: `start`, `written` | `skipped`, `complete`.

### `GET /api/cron/generate-articles`
Generates from the most recently updated topic. Query: `topicId?`, `limit?` (max 10).

### `GET /api/cron/update-price-rates`
Scrapes `2dec.net` rates into `price_rates` (markets: `sanaa`, `aden`, `gold`).

## Calling from the scheduler

`news_workers/src/index.ts` calls these via the `NEWS_SITE` service binding:

```
scrape-source/[key]  (all 12, staggered)
batch-generate
write-pipeline
update-price-rates
```
