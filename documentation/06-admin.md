# Admin Panel

Admin lives under `app/admin/`, gated by `app/admin/layout.tsx`.

## Auth

- Login: `loginAction` (`lib/auth-actions.ts`) validates against **`data/users.json`**
  via `lib/users.ts` (`findUserByEmailAndPassword`), then sets an httpOnly cookie
  `auth_session` (`lib/auth.ts` → `AUTH_SESSION_COOKIE`) holding the user id.
- `getAuthSessionUserId()` (`lib/auth-session.server.ts`) reads the cookie.
- `app/admin/layout.tsx` redirects to `/login` if there is no session, or to `/user`
  if the user's `role !== "admin"`.
- Logout: `logoutAction` deletes the cookie.

> Note: `lib/users.ts` reads `data/users.json` (file-backed). The Drizzle `users` table
> exists in the schema but auth currently uses the JSON file. Session cookies are
> dev-grade (store the raw user id) — not production-hardened.

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
| `admin/articles/actions.ts` | create draft, update, publish, upload/remove cover, inline image upload (R2 binding) |
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
actions. Preview renders via `components/article-tiptap-read-only.tsx`.

## Related admin API

- `GET /api/admin/news-sources/[key]` — source detail.
- `GET /api/generated-articles/[id]`, `GET /api/scraped-news/[id]`, `GET /api/topics`, `GET /api/topics/[id]/sources` — data for admin modals.
