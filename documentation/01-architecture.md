# Architecture

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, `--webpack`) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS v4, SCSS for the Tiptap editor |
| Editor | Tiptap 3 (+ vendored `@tiptap-pro` AI/provider) |
| Runtime | Cloudflare Workers (via `@opennextjs/cloudflare` / OpenNext) |
| Database | Cloudflare D1 (SQLite), accessed via the `DB` binding |
| Object storage | Cloudflare R2 via the `MEDIA` binding |
| ORM | Drizzle ORM (`drizzle-orm/d1`, plus a `sqlite-proxy` HTTP fallback) |
| AI | OpenRouter (`deepseek/deepseek-v4-flash`) |
| Package manager | pnpm 10 |
| Scheduler | Separate Worker `news_workers` → deployed as `news-latest` |

## Runtime model (Cloudflare)

- The Next.js app is built by `opennextjs-cloudflare build` into `.open-next/worker.js` and deployed with `opennextjs-cloudflare deploy` to Worker **`news-site`**.
- Bindings are declared in [`wrangler.toml`](../wrangler.toml):
  - `DB` → D1 database `news-site`
  - `MEDIA` → R2 bucket `news`
  - `ASSETS` → static assets
  - plain vars: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, `R2_PUBLIC_URL`, `NEXT_PRIVATE_MINIMAL_MODE`, `OPENROUTER_MODEL`
- Secrets (not in `wrangler.toml`): `OPENROUTER_API_KEY`, `CLOUDFLARE_D1_TOKEN`.

### Data access (`db/client.ts`)

`getDb()` returns a Drizzle client:

1. **Runtime (Worker):** uses the D1 binding (`getD1FromBindings()` reads the OpenNext `__cloudflare-context__` symbol) → `drizzle-orm/d1`.
2. **Local dev / build / scripts:** falls back to `drizzle-orm/sqlite-proxy` over the Cloudflare D1 HTTP API (`runD1Query`) using `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_DATABASE_ID` / `CLOUDFLARE_D1_TOKEN`.

`getD1FromBindings()` deliberately returns `undefined` when `NODE_ENV === "development"`, so local dev uses the HTTP path (real remote data).

### R2 access (`lib/r2.server.ts`)

Binding-only: `getMediaBucket()` reads `env.MEDIA` via `getCloudflareContext()`. There is no S3/env-var fallback. Public URLs are built from the `R2_PUBLIC_URL` var. `lib/cloudflare-bindings.ts` wraps `getCloudflareContext()`.

`initOpenNextCloudflareForDev()` (in `next.config.mjs`) makes bindings available under `next dev`; it is **guarded to non-production** so production builds don't open remote proxy sessions.

## Folder structure

```
app/
  layout.tsx                 Root layout: fonts, theme, react-grab
  fonts.ts                   Shubbak + Neirizi (next/font/local)
  globals.css                Tailwind v4 theme, admin text scale, font overrides
  (site)/(site-shell)/       Public site (header/footer shell)
    page.tsx                 Homepage (hero + per-category carousels)
    category/[id]/           Category page (slug or "all")
    news/[id]/               Article page
    search/                  Search
    tools/currency-converter/ Currency tool
    login/ subscribe/ user/ advertise/ privacy/ terms/
  admin/                     Admin panel (auth-gated)
  api/                       Route handlers (AI, cron, data, exchange-rate)
  notion-like/, simple/      Tiptap demo pages
components/                  UI (site + admin + Tiptap library)
contexts/ hooks/             React contexts and hooks
lib/                         Server logic (db-*, scraper, AI, auth, utils)
db/
  schema/                    Drizzle table definitions
  migrations/                SQL migrations
  client.ts                  getDb()
news_workers/                Scheduler Worker (cron)
scripts/                     Manual tools (3 kept; see package.json)
documentation/               This folder
```

## Build & run

| Command | Purpose |
|---|---|
| `pnpm dev` | Local dev (`next dev --webpack`) with bindings via OpenNext dev init |
| `pnpm build` | Next.js production build |
| `pnpm preview` | `opennextjs-cloudflare build && preview` (Wrangler dev, local) |
| `pnpm deploy` | `opennextjs-cloudflare build && deploy` to Cloudflare |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint (note: repo has many pre-existing warnings/errors) |
| `pnpm db:generate` / `db:push` / `db:studio` | Drizzle Kit against D1 HTTP |

## Key configuration files

- [`next.config.mjs`](../next.config.mjs) — dev bindings init; `images.remotePatterns` (R2 `r2.dev`, Unsplash, BBC, etc.).
- [`wrangler.toml`](../wrangler.toml) — Worker name, bindings, vars.
- [`drizzle.config.ts`](../drizzle.config.ts) — Drizzle Kit (`d1-http` driver).
- [`tsconfig.json`](../tsconfig.json) — path alias `@/*` → project root.
- [`opencode.json`](../opencode.json) — dev tooling (Next.js MCP).
