# Frontend

Arabic-first, RTL, Tailwind CSS v4. Public site lives under `app/(site)/(site-shell)/`.

## Shell

- `app/layout.tsx` — root layout: loads fonts, sets `lang="ar" dir="rtl"`, `font-sans`, theme provider, tooltip provider. `generateMetadata` sets `metadataBase` (from `SITE_URL`), the title template `%s | أخبار`, default OG/Twitter and the RSS `<link rel="alternate">`. (The dev-only `react-grab` script was removed.)
- `app/(site)/layout.tsx` — public site wrapper.
- `app/(site)/(site-shell)/layout.tsx` — renders `SiteNavbar`, `<main>`, `SiteFooter`, and the subscribe banner. The breaking-news marquee is toggled off via `SHOW_NEWS_MARQUEE = false`.

## Pages

| Route | File | Notes |
|---|---|---|
| `/` | `(site-shell)/page.tsx` | Hero + one carousel per category |
| `/category/[id]` | `category/[id]/page.tsx` | `id` is a category **slug** or `all`; 404 if invalid; a uuid/alias 301s to the slug. Paginated: 20 per page, `?page=N` |
| `/news/[id]` | `news/[id]/page.tsx` | Article view (`NewsArticleView` + server-rendered body via `ArticleBody`) |
| `/search` | `search/page.tsx` + `search-client.tsx` | Client-side search over published articles; `noindex` |
| `/tools/currency-converter` | `tools/currency-converter/page.tsx` | Uses `/api/exchange-rate` |
| `/login` | `login/page.tsx` | Login form (`loginAction`) |
| `/subscribe` | `subscribe/page.tsx` | Subscription CTA |
| `/user` | `user/page.tsx` | Member dashboard (auth-gated) |
| `/advertise` | `advertise/page.tsx` | Advertise form |
| `/privacy`, `/terms` | `privacy/page.tsx`, `terms/page.tsx` | Legal pages (linked from footer) |
| `/simple`, `/notion-like` | `simple/`, `notion-like/` | Tiptap editor demos |

### Homepage

`app/(site)/(site-shell)/page.tsx`:

- Uses request-scoped `cache()` helpers from `lib/db-site-cache.server.ts` (`getHomeHero`, `getHomeSection`, `getCategoriesCached`, `isSubscribedCached`) so layout, metadata and page share one query/cookie read. One query per category (8 newest with a cover; no slug→id lookup).
- Renders `HomeHeroSection` (featured + side + row) and at most `HOME_MAX_SECTIONS` (6) `HomeTopicCarousel`s (only categories with ≥ 2 articles). Emits WebSite + Organization JSON-LD (SearchAction → `/search?q=`).
- Only the featured hero image has `priority` (the LCP); cards lazy-load.
- Each carousel card shows cover, title, excerpt, and **date**; the section header has **prev/next arrows** and a plain **«المزيد» hyperlink** to `/category/{slug}` (placed to the left of the arrows in RTL).

### Search

Client-side filtering over `getPublishedArticles()` (title + excerpt). Arabic text is
normalized (diacritics/tatweel stripped; alef/ya/ta-marbuta/hamza variants unified) so
`اسرائيل` matches `إسرائيل`. Articles without a cover image still render (image omitted).

## Fonts

- `app/fonts.ts` — `next/font/local`:
  - **Shubbak** (weights 400-900, `--font-shubbak`) — the site font. ExtraLight/Light (200/300) were dropped: no `font-light`/`font-extralight`/`font-weight: 200|300` is used anywhere. `display: swap`, `adjustFontFallback: "Arial"`.
  - **Neirizi** (`--font-neirizi`) — currently referenced by no class; `preload: false` so it is not fetched on every page.
  - Files in `public/fonts/`.
- `app/globals.css`:
  - `--font-sans: var(--font-shubbak), …` and `--font-heading: var(--font-sans)`.
  - `html body { font-family: var(--font-sans); }` — neutralizes a **global** `body { font-family: "Inter" }` that Tiptap's stylesheet injects on article pages (Tiptap files themselves are untouched; editor internals keep their own fonts by specificity).
- **Admin text scale:** `.admin-scale { --text-*: calc(… * 1.1) }` (applied in `AdminLayoutShell`) scales all Tailwind `text-*` utilities in the admin by 10%.

## Components (public)

- `site-navbar.tsx`, `site-footer.tsx` — shell chrome.
- `home-hero.tsx`, `home-topic-carousel.tsx` — homepage.
- `category-page-view.tsx` — category listing.
- `news-article-view.tsx`, `article-body.tsx`, `article-highlights.tsx`, `article-image-gallery.tsx`, `article-image-section.tsx` — article rendering. `article-body.tsx` is a **server component** (renderer in `lib/article-body-render.tsx`) that turns the stored Tiptap JSON into HTML with no editor/JS, so crawlers get the body and there is no layout shift. Unknown nodes render their children, unknown marks are ignored, links are limited to http/https/mailto/tel (+ site-relative), external links get `rel="noopener noreferrer nofollow ugc"`, block elements carry `dir="auto"` and `textAlign` is honoured (physical left/right/center/justify, as the editor stored it). Body `h1` becomes `h2` (the title is the only `h1`). Tests: `tests/unit/article-body.test.ts`.
- `article-tiptap-read-only.tsx` — **admin-only** client Tiptap read-only preview (used by admin modals/preview pages); the public site does not use it.
- `subscription-gate.tsx` — blurs/gates `isMemberOnly` content.
- `site-ad-spots.tsx`, `site-subscribe-banner.tsx` — ads/branding.
- `currency-converter.tsx` — currency tool.
- `search/search-client.tsx` — search UI.
- `ui/*` — shadcn-style primitives (button, dialog, sheet, sidebar, …).

## Subscription gating

- `isSubscribed()` (`lib/subscription.ts`) → true when an auth session cookie exists.
- `SubscriptionGate` wraps member-only links/cards; unauthenticated users get a prompt.
- Server pages pass `isSubscribed` down from the shell.

## Ads

- `site_ads` table (`tier`: platinum > premium > gold > standard).
- `lib/site-ads-enabled.ts` — `areSiteAdsEnabled()` reads `SHOW_ADS` / `show_ads`; set to `0`/`false` to hide all ads (default: shown).
- `getActiveSiteAdsForHome` / `getActiveSiteAdsForArticle` filter by `show_on_home` / `show_on_article` and `is_active`, dedupe by image URL, sort by tier.

## Theme & misc

- Light/dark via `components/theme-provider.tsx`.
- The `react-grab` dev script is no longer loaded.
- Images served from R2 (`**.r2.dev`) and various news hosts; `remotePatterns` in `next.config.mjs`.

## SEO & indexing

- `lib/seo.ts` — pure helpers: `siteUrl()` (env `SITE_URL`, default `https://news-site.mshami2021.workers.dev`), `absoluteUrl()`, `jsonLdString()` (escapes `<`, `>`, `&` so JSON-LD cannot close the script tag), JSON-LD builders (NewsArticle, BreadcrumbList, WebSite/Organization) and XML builders (sitemap, news sitemap, RSS). Tests: `tests/unit/seo.test.ts`.
- `app/robots.ts` allows `/`, disallows `/admin /api /login /user /search /notion-like /simple`, lists both sitemaps.
- `/sitemap.xml` (route handler; up to 50k published articles by `updatedAt`, categories, home — selects only id + timestamps), `/news-sitemap.xml` (Google News: last 48h, max 1000, `news:publication` name «أخبار», language `ar`), `/rss.xml` (latest 50, excerpt + cover enclosure). The three route handlers send `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` and keep a 60 s per-isolate memo to protect D1 from crawler bursts. (`robots.ts` is a metadata route and cannot set headers.)
- Per-page metadata: article (canonical, `og:type=article`, published/modified time, cover image, Twitter large card, NewsArticle + BreadcrumbList JSON-LD; member-only articles set `isAccessibleForFree:false` with a `hasPart` pointing at `.article-body`), category (canonical per page, `pagination.previous/next`, `?page=N`), home. Slug normalisation uses `permanentRedirect` (308).
- Member-only articles: crawlers (not logged in) see the gate page with title + excerpt; the full body is not served to them. Cards link with a real `<a href>` (the dialog is a click handler), so they are crawlable.
- Images: alt text is the article title for covers/cards (body images use their own alt/title); only the article cover / home hero / first category row is `priority`. Listing images stay `unoptimized` because there is no Images binding yet, so `/_next/image` would return the same bytes. Follow-up: CDN / Cloudflare Images resizing, then drop `unoptimized`.

### Caching plan (pages)

Pages read the session cookie (`isSubscribed`) for paywall badges and ad suppression, so they are **per-user** and must not be sent with a public `s-maxage` (a shared cache would leak the member view or serve stale gates). Follow-ups, in order of effort: (1) move the paywall/ads decision to a small client island or an edge middleware flag so the HTML is identical for everyone, then add `s-maxage` + `stale-while-revalidate` to home/category/article; or (2) enable the OpenNext incremental cache (R2/KV) with `revalidate` on anonymous renders and bypass it when the session cookie is present. Until then only robots/sitemaps/RSS are cacheable, and per-request D1 queries are minimised with React `cache()`.

### Search Console checklist

1. Add a property for the production origin (Domain property if a custom domain exists; URL-prefix for `workers.dev`). Verify via DNS TXT or the HTML-tag method.
2. Submit `sitemap.xml` and `news-sitemap.xml` (Sitemaps report). Apply to Google News Publisher Center if desired.
3. Use URL Inspection on the home page and one article; check the rendered HTML contains the body and the JSON-LD passes the Rich Results Test.
4. `workers.dev` is shared infrastructure and cannot be a long-term canonical home. Attach a **custom domain**, set `SITE_URL` (wrangler `[vars]`) to it, redeploy, and 301 the `workers.dev` hostname to the custom domain (Cloudflare redirect rule / Worker). Re-verify the property and re-submit sitemaps.
