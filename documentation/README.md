# Documentation — «أخبار» News Platform

This folder documents the entire news website: architecture, data model, scraping,
AI generation, frontend, admin, API, and deployment/operations.

> **Brand:** `أخبار` (`ar.newsBrand`, `lib/ui-ar.ts`)
> **Production:** https://news-site.mshami2021.workers.dev (Cloudflare Worker `news-site`)
> **Local preview (pm2):** http://localhost:3002

## Index

| Doc | What it covers |
|---|---|
| [01-architecture.md](./01-architecture.md) | Tech stack, runtime, folder structure, request flow |
| [02-data-model.md](./02-data-model.md) | D1 tables, relationships, migrations |
| [03-scraping-pipeline.md](./03-scraping-pipeline.md) | Sources, scraper, cron schedule, volume |
| [04-ai-generation.md](./04-ai-generation.md) | Topic grouping, classification, article generation, quotas, models |
| [05-frontend.md](./05-frontend.md) | Public pages, components, fonts, subscription gating |
| [06-admin.md](./06-admin.md) | Admin routes, auth, server actions, settings |
| [07-api-reference.md](./07-api-reference.md) | All HTTP API routes |
| [08-deployment-and-operations.md](./08-deployment-and-operations.md) | Cloudflare, wrangler, pm2, env/secrets, runbooks, troubleshooting |

## TL;DR

- **Next.js 16** (App Router, webpack) deployed to **Cloudflare Workers** via **OpenNext** (`@opennextjs/cloudflare`).
- **D1** (SQLite) for data via the `DB` binding; **R2** for images via the `MEDIA` binding.
- A separate scheduler Worker (`news_workers`, deployed as `news-latest`) runs **every 10 minutes** and drives the pipeline: scrape → group topics → generate articles → write/publish → price rates.
- **AI:** OpenRouter, model `deepseek/deepseek-v4-flash`, for classification and Arabic article generation.
- **Arabic-first** RTL news site with categories, member-only gating, ads, search, currency tool, and an admin panel.

## Content flow at a glance

```
news-latest cron (*/10)
   ├─ minute 0:  scrape every source  ──► scraped_news
   │             batch-generate        ──► generated_articles + articles
   ├─ every run: write-pipeline (runWriter) ──► generated_articles + articles
   └─ every run: update-price-rates   ──► price_rates
```

Each `/api/cron/scrape-source/[key]` also runs **topic grouping**, which turns
scraped items into `topics` and assigns them a category via the AI classifier.
