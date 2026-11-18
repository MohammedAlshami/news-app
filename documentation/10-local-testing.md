# Local testing against an isolated D1 (never production)

`wrangler.toml` binds D1 with `remote = true`, so `opennextjs-cloudflare preview` talks to the PRODUCTION database.
For admin / pipeline testing use the isolated copy instead:

1. `wrangler.test.toml` (git-ignored) = `wrangler.toml` without `remote = true`, other name, `SITE_URL=http://localhost:3011`.
2. Create the schema from production (read-only export) and apply the additive migration:
   ```
   wrangler d1 export news-site --remote --no-data --output schema.sql
   wrangler d1 execute news-site --local -c wrangler.test.toml --persist-to .wrangler-test --file schema.sql
   wrangler d1 execute news-site --local -c wrangler.test.toml --persist-to .wrangler-test --file db/migrations/0018_pipeline_hardening.sql
   ```
   Seed small tables the same way (`d1 export --remote --no-schema --table categories`, `news_sources`, `site_ads`, `price_rates`, a few `articles`).
3. Run the built worker: `wrangler dev -c wrangler.test.toml --port 3011 --persist-to .wrangler-test --local` (secrets come from `.dev.vars`).
4. Drive the pipeline with the cron routes and `Authorization: Bearer $CRON_SECRET`:
   `/api/cron/scrape-source/<key>`, `/api/cron/cluster`, `/api/cron/write-pipeline`, `/api/cron/health`.

Local R2 uploads are stored locally but the stored URL uses `R2_PUBLIC_URL` (the production host), so uploaded images look broken locally — expected.
Unit tests use an in-memory SQLite; they cannot catch D1-specific problems (e.g. `db.batch` with raw statements), so run the pipeline here before deploying.
