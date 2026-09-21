# Data Model (Cloudflare D1)

Schema definitions live in [`db/schema/`](../db/schema) (Drizzle ORM). Migrations live in
[`db/migrations/`](../db/migrations). `getDb()` is documented in
[01-architecture.md](./01-architecture.md).

## Entity relationships

```
news_sources (key)                     categories (id)
        │                                   │  ▲
        │ (source_key)                      │  │ category_id
        ▼                                   ▼  │
   scraped_news ──topic_id──► topics ──────────┘
        (raw scraped)          (clustered)      │ topic_id
                                               ▼
                                      generated_articles
                                               │ (same title/excerpt/body)
                                               ▼
                                          articles  (public site)
                                               │ category_id
                                               ▼
                                          categories

images (cover dedup, keyed by sha256)
site_ads, users, price_rates, advertise_inquiries, finance_revenue  (standalone)
```

## Tables

### `categories`
Top-level site sections.

| column | type | notes |
|---|---|---|
| `id` | text PK | UUID |
| `name` | text | Arabic display name |
| `slug` | text unique | e.g. `politics`, `environment` |
| `description` | text? | |
| `daily_quota` | integer | max AI articles/day for this category (migration `0014`) |
| `created_at` | timestamp_ms | |

Current slugs: `economy`, `politics`, `culture`, `sports`, `health`, `technology`, `science`, `environment`.
(The former `climate` category was merged into `environment`.)

### `topics`
Clusters of scraped articles about the same event.

| column | type | notes |
|---|---|---|
| `id` | text PK | UUID |
| `title` | text | Arabic topic title |
| `article_count` | integer | number of scraped articles attached |
| `category_id` | text → `categories.id` | assigned by the AI classifier |
| `parent_id` | text? | optional parent topic (hierarchy) |
| `type` | `persistent` \| `event` | |
| `is_active` | boolean | |
| `start_date` / `end_date` | text? | |
| `created_at` / `updated_at` | timestamp_ms | |

### `scraped_news`
Raw scraped items.

| column | type | notes |
|---|---|---|
| `id` | text PK | |
| `source` | text | display name |
| `source_key` | text | scraper key (`youm7`, `bbc`, …) |
| `category` | text | **source-native** category (e.g. `tech`, `world`) |
| `query` | text? | |
| `title`, `excerpt`, `content` | text | |
| `url` | text | dedup key per source |
| `image_url` | text? | items without an image are dropped |
| `published_at` | text? | |
| `scraped_at` | timestamp_ms | |
| `raw_json` | text | |
| `topic_id` | text? → `topics.id` | set by topic grouping |

### `generated_articles`
AI-generated articles (same shape as `articles`, kept separate).

| column | type | notes |
|---|---|---|
| `id` | text PK | |
| `title`, `excerpt`, `body` | text | `body` = Tiptap JSON (stringified) |
| `cover_image_url` | text? | R2 public URL |
| `original_cover_image_url` | text? | source URL before R2 |
| `image_urls` | text | JSON array |
| `highlights` | text | JSON array (3–5 bullets) |
| `topic_id` | text? → `topics.id` | |
| `source_article_ids` | text | JSON array of `scraped_news.id` |
| `is_published`, `views` | | |
| `created_at`, `updated_at` | timestamp_ms | |

### `articles`
Published articles served on the public site.

| column | type | notes |
|---|---|---|
| `id` | text PK | |
| `title`, `excerpt`, `body` | text | `body` = Tiptap JSON |
| `views` | integer | |
| `category_id` | text? | logical ref to `categories.id` (no FK) |
| `is_published` | boolean | shown publicly only when true |
| `is_member_only` | boolean | gated behind login |
| `cover_image_url` | text? | |
| `original_cover_image_url` | text? | |
| `cover_image_hash` | text? | sha256 for dedup |
| `highlights` | text | JSON array |
| `created_at`, `updated_at` | timestamp_ms | |

### `images`
Cover-image dedup registry (content-addressed by sha256).

| column | type | notes |
|---|---|---|
| `id` | text PK | |
| `source_url` | text | original image URL |
| `r2_url` | text | uploaded R2 public URL |
| `hash` | text unique | sha256 of bytes |
| `first_used_at`, `updated_at` | timestamp_ms | |
| `usage_count` | integer | incremented on reuse |

### `news_sources`
Configured sources shown in admin.

| column | type | notes |
|---|---|---|
| `key` | text PK | matches `ScraperSourceKey` |
| `name`, `name_ar`, `url` | text | |
| `is_enabled` | boolean | |
| `metadata` | text | JSON blob (e.g. `lastScrapedAt`) |

### `price_rates`
Currency/gold rates for the converter.

| column | type | notes |
|---|---|---|
| `id` | text PK | |
| `market` | text | `sanaa` \| `aden` \| `gold` |
| `asset_type` | text | `currency` \| `gold` |
| `currency_code`, `currency_name` | text | |
| `sell_rate`, `buy_rate` | integer | |
| `scraped_at` | timestamp_ms | |
| `source_url` | text | |

### `site_ads`
Banner ads.

| column | type | notes |
|---|---|---|
| `id` | text PK | |
| `name` | text | admin label |
| `image_url` | text? | R2 or `/uploads/...` |
| `href` | text | click-through |
| `show_on_home`, `show_on_article`, `is_active` | boolean | |
| `tier` | text | `standard` \| `gold` \| `premium` \| `platinum` (sort order) |
| `created_at`, `updated_at` | timestamp_ms | |

### `users`
Auth users (file-backed credentials — see `lib/users.ts`).

| column | type | notes |
|---|---|---|
| `id` | text PK | |
| `email` | text unique | |
| `name` | text? | |
| `role` | text | `user` \| `admin` |
| `created_at` | timestamp_ms | |

### `advertise_inquiries`
Public "advertise with us" submissions.

| column | type | notes |
|---|---|---|
| `id` | text PK | |
| `name`, `email`, `phone?`, `company?`, `message` | text | |
| `status` | text | `new` \| `read` \| `archived` |
| `admin_notes` | text? | |
| `created_at`, `updated_at` | timestamp_ms | |

### `finance_revenue`
Revenue records for the admin finance page.

| column | type | notes |
|---|---|---|
| `id` | text PK | |
| `date` | text | |
| `source` | enum | `google_ads` \| `memberships` \| `paid_articles` \| `direct_ads` |
| `amount` | real | |
| `description` | text | |
| `created_at` | timestamp_ms | |

## Migrations

`db/migrations/` (applied manually against D1; `meta/_journal.json` is empty):

`0001_scraped_news`, `0002_category_slugs`, `0003_price_rates`,
`0004_add_content_to_scraped_news`, `0005_topics`, `0006_topics_article_count`,
`0007_generated_articles`, `0008_news_sources`, `0009_article_member_only`,
`0010_skynews_source`, `0011_more_sources`, `0012_new_categories_highlights`,
`0013_topics_hierarchy_images`, `0014_category_daily_quota`.

To add one: write `db/migrations/00NN_name.sql`, apply it to D1 (HTTP API or
`wrangler d1 execute`), and update the Drizzle schema in `db/schema/`.

## Notes

- `articles.category_id` has **no FK** (kept flexible); `topics.category_id` and
  `scraped_news.topic_id` do.
- `generated_articles` and `articles` are separate: the former is the AI workspace,
  the latter is the public feed. Generated articles are copied into `articles` at
  creation time.
- Deleting a topic sets `scraped_news.topic_id` and `generated_articles.topic_id` to NULL.
