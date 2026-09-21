# Scraping Pipeline

## Scheduler

The pipeline is driven by a separate Worker, [`news_workers`](../news_workers), deployed as
**`news-latest`** (its own `wrangler.toml`, service binding `NEWS_SITE` → `news-site`).

Cron: **`*/10 * * * *`** (every 10 minutes). In `news_workers/src/index.ts`:

- **On the hour (`minute === 0`):** scrape **all sources** (5s stagger) then run `batch-generate`.
- **Every run (every 10 min):** `write-pipeline`, then `update-price-rates`.
- The Worker also exposes a `fetch` handler that runs the same pipeline manually.

```
minute 0 :  scrape-source/* (12)  →  batch-generate
every 10 :  write-pipeline        →  update-price-rates
```

> `news-site` itself has **no cron triggers**; `news-latest` is the only scheduler.

## Sources

Defined in [`lib/news-scraper.ts`](../lib/news-scraper.ts) (`ScraperSourceKey` + `SOURCES`).
The scheduler's `SOURCE_KEYS` matches this list.

| key | name |
|---|---|
| `rt` | RT عربي |
| `independent` | إندبندنت عربية |
| `skynews` | سكاي نيوز عربية |
| `youm7` | اليوم السابع |
| `bbc` | بي بي سي عربي |
| `alaraby` | العربي الجديد |
| `elwatan` | الوطن |
| `alquds` | القدس |
| `shabiba` | شبيبة |
| `addustour` | الدستور |
| `alhurra` | الحرة |
| `aawsat` | الشرق الأوسط |

Each source has `categoryUrl(category)`, `supportedCategories`, optional `searchHeaders`,
and a `parse` function. Source-native categories (e.g. `sport`, `world`, `tech`) are later
mapped to site categories (see [04-ai-generation.md](./04-ai-generation.md)).

The DB table `news_sources` mirrors the list (`is_enabled`, `metadata.lastScrapedAt`).
Admin can enable/disable and trigger a scrape (`/admin/news-sources`).

## Scrape endpoint

`GET /api/cron/scrape-source/[key]` (`app/api/cron/scrape-source/[key]/route.ts`):

1. Load source; 404 if missing, skip if disabled.
2. Read `lastScrapedAt` from source metadata.
3. For each supported category: `scraper.scrape({ category })`.
4. Keep only items with `publishedAt >= lastScrapedAt` (undated items pass); fill missing `publishedAt` with now.
5. `insertScrapedNewsRows(...)`:
   - dedupes within the batch by `url`,
   - **drops items without an image** (no fallback images),
   - skips URLs already in the DB for that source,
   - inserts one row at a time (D1 SQL-variable limits).
6. `updateLastScrapedAt(key, now)`.
7. `runTopicGrouping()` — cluster new items into topics (see [04-ai-generation.md](./04-ai-generation.md)).

`GET /api/cron/scrape-news` scrapes all enabled sources with an optional `?category=` and
`?limit=`, returning a JSON summary. Used by the admin scrape modal.

## Volume (measured)

Actual net-new rows in `scraped_news` over the last ~2 weeks: **~760/day average**
(range ~570–880). This is *after* URL dedup and the image requirement.

Because scraping runs hourly across 12 sources, raw fetch volume is higher than stored volume.

## Adding a source

1. Add the key to `ScraperSourceKey` and implement `categoryUrl` + `parse` in `SOURCES`.
2. Add the key to `news_workers/src/index.ts` `SOURCE_KEYS`.
3. Insert a row into `news_sources` (name/url/is_enabled).
4. Add the host to `images.remotePatterns` in `next.config.mjs` if covers are hotlinked.

## Related files

- [`lib/news-scraper.ts`](../lib/news-scraper.ts) — source configs + parsers.
- [`lib/db-scraped-news.server.ts`](../lib/db-scraped-news.server.ts) — insert/list helpers.
- [`lib/db-news-sources.server.ts`](../lib/db-news-sources.server.ts) — source metadata.
- [`lib/db-topics.server.ts`](../lib/db-topics.server.ts) — `runTopicGrouping`.
- [`docs/scraper-guide.md`](../docs/scraper-guide.md) — additional scraper notes.
