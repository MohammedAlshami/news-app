# Deployment & Operations

## Environments

| Environment | What runs | URL |
|---|---|---|
| Production | Cloudflare Worker `news-site` (OpenNext build) | https://news-site.mshami2021.workers.dev |
| Local preview | pm2 process `news-app` = `opennextjs-cloudflare preview --remote --port 3002` | http://localhost:3002 |
| Local dev | `pnpm dev` (`next dev --webpack`, bindings via OpenNext dev init) | http://localhost:3000 (falls back to 3001+) |
| Scheduler | Worker `news-latest` (`news_workers/`) | cron `*/10 * * * *` |

> Port 3000 is used by another pm2 app (`imper-web`), so the news app preview runs on **3002**.

## Deploy

```bash
# build + deploy the main site
pnpm run deploy            # opennextjs-cloudflare build && deploy

# deploy without rebuilding (uses existing .open-next)
pnpm exec opennextjs-cloudflare deploy

# deploy the scheduler worker
cd news_workers && pnpm exec wrangler deploy
```

Requires Wrangler auth (`npx wrangler whoami`). If it fails with
`Invalid access token [code: 9109]`, re-run `npx wrangler login`.

## pm2

```bash
pm2 list
pm2 logs news-app
pm2 restart news-app
pm2 stop news-app
pm2 save            # persist across reboots
```

`news-app` command: `/bin/bash -lc "exec pnpm exec opennextjs-cloudflare preview --remote --port 3002"`.
`--remote` makes **D1 and R2 production resources** available locally (so R2 uploads match the public URL).

After code changes, rebuild then restart:
```bash
pnpm exec opennextjs-cloudflare build && pm2 restart news-app
```

## Environment variables & secrets

**Worker vars** (`wrangler.toml [vars]`):
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, `R2_PUBLIC_URL`, `NEXT_PRIVATE_MINIMAL_MODE`, `OPENROUTER_MODEL`.

**Worker secrets:**
- `OPENROUTER_API_KEY` — AI calls.
- `CLOUDFLARE_D1_TOKEN` — build-time/HTTP fallback only (runtime uses the D1 binding).

```bash
npx wrangler secret list
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret delete <NAME>
```

**Local `.env.local`** (gitignored): `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`,
`R2_PUBLIC_URL`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, `CLOUDFLARE_D1_TOKEN`.
These let local dev / build / scripts talk to remote D1 over the HTTP API and build R2 URLs.

> Build-time static generation (site-shell layout) needs the D1 HTTP vars; the production
> runtime itself uses the `DB` binding and needs no token.

## Cloudflare resources

| Resource | Name | Binding |
|---|---|---|
| D1 database | `news-site` | `DB` |
| R2 bucket | `news` | `MEDIA` |
| Worker | `news-site` | — |
| Worker | `news-latest` (from `news_workers`) | — |

R2 public URL: `https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev` (`wrangler r2 bucket dev-url get news`).

## Migrations

Migrations are applied manually (Drizzle `meta/_journal.json` is empty):

```bash
# via wrangler
npx wrangler d1 execute news-site --remote --file=db/migrations/0014_category_daily_quota.sql
# or via the D1 HTTP API (POST .../raw with method:"run")
```

## Tiptap Pro vendoring

`@tiptap-pro/extension-ai` and `@tiptap-pro/provider` are **vendored** as local tarballs in
[`vendor/tiptap-pro/`](../vendor/tiptap-pro) and referenced with `file:` in `package.json`,
so installs don't need the private registry token. The `.npmrc` no longer carries the
(dead) Tiptap registry token.

## Common runbooks

**Generate more articles**
- Bulk: `curl -N ".../api/cron/batch-generate?limit=50"` (respects per-category daily quota).
- Single: `GET /api/cron/generate-articles?topicId=…`.
- Raise limits in **`/admin/settings`**.

**Re-categorize topics** (after misclassification)
- Fetch topics, classify titles with the described prompt, then `UPDATE topics SET category_id` and
  `UPDATE articles SET category_id WHERE title IN (…)` (generated titles are unique).

**Re-scrape a source**
- `GET /api/cron/scrape-source/<key>` or the admin scrape modal.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `wrangler` auth errors (`9109`) | OAuth token invalid/expired → `npx wrangler login` |
| Build hangs / "remote proxy session" error | `initOpenNextCloudflareForDev` running during build → it's guarded to dev only; ensure `NODE_ENV=production` during build |
| Local preview 404 on `/api/...` after changes | rebuild `.open-next` then `pm2 restart news-app` |
| Search returns nothing | ensure `coverImageUrl` is passed to the client and Arabic normalization is applied |
| Article pages show Inter instead of Shubbak | `html body { font-family: var(--font-sans) }` override in `globals.css` must be present (Tiptap injects a global `body{font-family:Inter}`) |
| `pnpm install` 403 on `registry.tiptap.dev` | use the vendored `file:` deps (already in `package.json`) |

## Known issues / gotchas

- `/api/cron/*` is unauthenticated.
- Admin auth is dev-grade (cookie stores the raw user id; users from `data/users.json`).
- `articles.category_id` has no FK; the `articles`→`topics` link is by **title** (unique).
- No OpenRouter provider preference → spend can vary by routed provider.
- `.next` can hold stale route types after deleting a route; `rm -rf .next` before typecheck.
- `pnpm lint` reports thousands of pre-existing warnings/errors (not a gate).
