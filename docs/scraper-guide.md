# News Scraper Guide

## Current Status

- Not deployed yet.
- Local typecheck passes.
- Direct scraper tests pass for:
  - `RT Arabic`
  - `Independent Arabia`
  - `Sky News Arabia`
  - `Youm7`
  - `BBC Arabic`
  - `Al Quds`
  - `El Watan News`
  - `Al Araby Al Jadeed`
- The old admin pagination type errors were fixed.

## Architecture

The scraper is split into three layers:

- `lib/news-scraper.ts`
  - Class-based scraper logic.
  - Knows how to fetch and parse each source.
- `lib/db-scraped-news.server.ts`
  - Persists scraped rows into D1.
- `app/api/cron/scrape-news/route.ts`
  - Runs the daily scrape for all configured sources/categories.

The Cloudflare worker in `news_workers/src/index.ts` is just the cron trigger. It calls the app route.

## Database

The table created for scraped output is:

- `scraped_news`

Columns:

- `id`
- `source`
- `source_key`
- `category`
- `query`
- `title`
- `excerpt`
- `url`
- `image_url`
- `published_at`
- `scraped_at`
- `raw_json`

Migration file:

- `db/migrations/0001_scraped_news.sql`

## Supported Sources

### RT Arabic

Base URLs:

- Search: `https://arabic.rt.com/search/?q=...`
- Categories:
  - `world`
  - `sport`
  - `business`
  - `news`
  - `middle_east`
  - `russia`
  - `features`
  - `press`
  - `prg`
  - `satelites`
  - `guide`
  - `docfilms`

What works:

- Search parsing from public frontend HTML.
- Category parsing from public frontend HTML.

### Independent Arabia

Base URLs:

- Search: `https://www.independentarabia.com/search/content?keys=...`
- Categories:
  - `news`
  - `world`
  - `middle_east`
  - `politics`
  - `economy`
  - `culture`
  - `sport`
  - `health`
  - `varieties`
  - `science`
  - `environment`
  - `arts`

What works:

- Search page returns structured result URLs.
- Category pages return structured result URLs.
- The current parser reads the embedded `ItemList` URLs and uses them as results.

### Sky News Arabia

Base URLs:

- Search: `https://www.skynewsarabia.com/search?q=...` (search is JS-rendered, not scrapable)

### Youm7

Base URLs:

- Search: `https://www.youm7.com/Home/Search?allwords=...`
- Categories:
  - `politics`, `world`, `arab`, `business`, `sport`, `art`, `health`, `tech`

What works:

- Category pages return JSON-LD CollectionPage with ItemList (40 articles).
- Article content extracted from HTML.

### BBC Arabic

Base URLs:

- Search: `https://www.bbc.com/arabic/search?q=...`
- Categories:
  - `world`, `middle_east`, `sport`, `climate`

What works:

- Category pages return JSON-LD @graph with ItemList.
- Article content extracted from AMP version.

### Al Quds

Base URLs:

- Search: `https://www.alquds.com/search?q=...`
- Categories:
  - `palestine`, `arab-and-world`, `business`, `sport`, `misc`, `opinions`

What works:

- Category pages parsed via HTML regex for article links.
- Article content extracted from HTML.

### El Watan News

Base URLs:

- Search: `https://www.elwatannews.com/Home/Search?allwords=...`
- Categories:
  - `egypt`, `world`, `business`, `art`, `misc`, `accidents`

What works:

- Category pages parsed via HTML regex for article links.
- Article content extracted from HTML.

### Al Araby Al Jadeed

Base URLs:

- Search: `https://www.aajeg.com/search?search_api_fulltext=...`
- Categories:
  - `news-egypt`, `news-syria`, `news-palestine`, `news-world`, `politics`, `economy`, `sport`, `culture`

What works:

- Category pages parsed via HTML regex for article links.
- Article content extracted from HTML (Drupal).
- Categories:
  - `world`
  - `middle_east`
  - `sport`
  - `business`
  - `technology`
  - `varieties`

What works:

- Category pages return JSON-LD `ItemList` with article URLs.
- Article content is fetched from AMP version (`/amp/{path}`) which has server-rendered HTML.
- Article metadata (title, description, image, date) extracted from JSON-LD on AMP page.
- Search is not supported (results loaded via AngularJS API calls).

## Cron Flow

1. Cloudflare cron runs `news_workers`.
2. `news_workers` calls `/api/cron/scrape-news`.
3. The route creates a scraper per source.
4. Each source scrapes its configured categories.
5. Results are inserted into `scraped_news`.

Cron schedule:

- `0 3 * * *`

## How To Add Another Source

Use this checklist:

1. Confirm the source page is publicly reachable from this environment.
2. Verify search and category URLs separately.
3. Prefer frontend HTML or embedded structured data.
4. Avoid private GraphQL or API endpoints unless they work without session/captcha friction.
5. Add one source parser in `lib/news-scraper.ts`.
6. Add supported categories only after the URLs are verified.
7. Run direct Node tests for:
   - one search query
   - one category page
8. Run `pnpm run typecheck`.

## Scraping Rules

- Keep source-specific logic isolated in the scraper class.
- Prefer stable selectors:
  - article cards
  - structured data
  - JSON-LD
  - embedded page state
- Avoid duplicating fetch logic.
- Normalize URLs before saving.
- Store the raw payload in `raw_json` for debugging and future reprocessing.
- Keep a source/category map in one place.
- If a source blocks search, do not force it into the pipeline.

## Testing Notes

Validated locally:

- `pnpm run typecheck`
- `node` execution of `lib/news-scraper.ts`

Observed outputs:

- RT Arabic search and category pages returned items.
- Independent Arabia search and category pages returned items.

## Future Improvements

- Add de-duplication before insert if the same article appears in multiple categories.
- Add a per-source fetch limit and rate limiting.
- Add a backfill script that can scrape and persist one source at a time.
- Add a small admin UI for viewing `scraped_news`.
