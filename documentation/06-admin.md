# Admin Panel

Admin lives under `app/admin/`, gated by `app/admin/layout.tsx`.

## Auth

- **Users** come from the `AUTH_USERS` Worker secret (JSON array of `{ id, email, role, passwordHash }`),
  parsed by `lib/auth/users-config.ts`. There is no `data/users.json` any more. Generate hashes with
  `pnpm auth:hash-password '<password>'` (PBKDF2-SHA256, 100k iterations: the Workers maximum).
- **Login**: `loginAction` (`lib/auth-actions.ts`) verifies the password (`lib/auth/password.ts`) and sets an
  httpOnly, Secure, SameSite session cookie holding an **HMAC-signed token** (`lib/auth/session.ts`,
  key = `SESSION_SECRET`, with expiry). Tokens that are unsigned, tampered or expired are rejected.
  A best-effort per-isolate throttle limits failed logins; add a Cloudflare WAF rate-limiting rule on
  `POST /login` (e.g. 10 requests / 10 min / IP) for a hard guarantee.
- **Guards** (`lib/admin-guard.server.ts`):
  - `requireAdmin()` for server actions and pages (redirects).
  - `requireAdminApi()` for route handlers (401/403 JSON).
  - `requireCronSecret(request)` / `requireCronOrAdmin(request)` for `/api/cron/*` (`Authorization: Bearer <CRON_SECRET>`).
- **Layouts do not protect server actions** (they are directly POSTable), so **every exported action in
  `app/admin/**/actions.ts` must start with `await requireAdmin()`**. `tests/unit/security-guards.test.ts`
  fails the build otherwise. The only public action is `incrementArticleViewAction` (`lib/view-actions.ts`),
  which validates the id and only bumps views of published articles.
- `app/admin/layout.tsx` still redirects unauthenticated users to `/login` and non-admins to `/user`.
  Admin, `notion-like`, `simple`, `login` and `user` pages are `noindex, nofollow`.
- Logout: `logoutAction` deletes the cookie.

### Uploads

`lib/upload-sniff.ts` sniffs magic bytes (JPEG/PNG/WebP/GIF/AVIF); extension and `Content-Type` are derived
from the bytes, never from `file.type` or the file name. SVG/HTML and everything else is rejected. Max 5MB
(`serverActions.bodySizeLimit` is `6mb` in `next.config.mjs`). Objects go to R2 only, under content-hash keys
(`articles/<id>/cover/<sha256>.<ext>`, `articles/<id>/inline/…`, `ads/<id>/…`) with
`Cache-Control: public, max-age=31536000, immutable`.

### Article save validation

`updateArticleAction` caps title (300) and excerpt (1000), requires every `categoryId` to exist, and runs the
body through `lib/tiptap-sanitize.ts`: JSON must be a `doc` of at most 500KB, link marks with hrefs other than
http/https/mailto/tel/relative are removed, image nodes with `data:`/non-http(s) sources are dropped.

## Routes

| Route | File | Purpose |
|---|---|---|
| `/admin` | `page.tsx` | Dashboard / stats |
| `/admin/articles` | `page.tsx` + `[id]/` + `preview/[id]/` | Editorial articles (Tiptap editor) |
| `/admin/generated_articles` | `page.tsx` | AI-generated articles list |
| `/admin/scraped_articles` | `page.tsx` | Raw scraped items |
| `/admin/topics` | `page.tsx` | Topic clusters |
| `/admin/news-sources` | `page.tsx` | Sources list + enable/disable + scrape |
| `/admin/finance` | `page.tsx` + `finance-client.tsx` | Revenue records |
| `/admin/advertise` | `page.tsx` + `[id]/` | Advertise inquiries |
| `/admin/ads` | `page.tsx` + `[id]/` | Site banner ads |
| `/admin/users`, `/admin/clients` | `page.tsx` | Users |
| `/admin/settings` | `page.tsx` | **Per-category daily generation quota** |

## Server actions

| File | Actions |
|---|---|
| `admin/articles/actions.ts` | create draft, update, publish, upload/remove cover, inline image upload (R2 binding) (all `requireAdmin()`-guarded) |
| `admin/categories/actions.ts` | create/update category |
| `admin/ads/actions.ts` | create/update/remove site ads (image upload to R2) |
| `admin/advertise/actions.ts` | update inquiry status/notes |
| `admin/generated_articles/actions.ts` | publish/delete generated articles |
| `admin/settings/actions.ts` | `updateCategoryQuotasAction` |

## Settings (daily quotas)

- `app/admin/settings/page.tsx` loads `getCategoryQuotas()` and renders
  `components/admin-category-quotas-form.tsx`.
- The form lets you set `categories.daily_quota` per category and saves via
  `updateCategoryQuotasAction`.
- These quotas gate both `runWriter` and `batch-generate` (see [04-ai-generation.md](./04-ai-generation.md)).

## Navigation

`components/sidebar-03/app-sidebar.tsx` defines the sidebar (`dashboardRoutes`), including
the **الإعدادات** (`/admin/settings`) item. `components/admin-layout-shell.tsx` wraps the
panel and applies the `.admin-scale` text scaling (+10%).

## Editorial editor

`app/admin/articles/[id]` uses `components/create-article-form.tsx` → `SimpleEditor`
(`components/tiptap-templates/simple/simple-editor.tsx`) with the shared extension pack
(`lib/tiptap-article-extensions.ts`). Inline images and covers upload to R2 through server
actions. Preview renders via `components/article-tiptap-read-only.tsx` (admin-only client component; the public site uses the server-rendered `components/article-body.tsx`).

## Related admin API

- `GET /api/admin/news-sources/[key]` — source detail.
- `GET /api/generated-articles/[id]`, `GET /api/scraped-news/[id]`, `GET /api/topics`, `GET /api/topics/[id]/sources` — data for admin modals.
