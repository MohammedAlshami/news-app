# Frontend

Arabic-first, RTL, Tailwind CSS v4. Public site lives under `app/(site)/(site-shell)/`.

## Shell

- `app/layout.tsx` — root layout: loads fonts, sets `lang="ar" dir="rtl"`, `font-sans`, theme provider, tooltip provider, and the `react-grab` script (all environments).
- `app/(site)/layout.tsx` — public site wrapper.
- `app/(site)/(site-shell)/layout.tsx` — renders `SiteNavbar`, `<main>`, `SiteFooter`, and the subscribe banner. The breaking-news marquee is toggled off via `SHOW_NEWS_MARQUEE = false`.

## Pages

| Route | File | Notes |
|---|---|---|
| `/` | `(site-shell)/page.tsx` | Hero + one carousel per category |
| `/category/[id]` | `category/[id]/page.tsx` | `id` is a category **slug** or `all`; 404 if invalid |
| `/news/[id]` | `news/[id]/page.tsx` | Article view (`NewsArticleView` + Tiptap read-only body) |
| `/search` | `search/page.tsx` + `search-client.tsx` | Client-side search over published articles |
| `/tools/currency-converter` | `tools/currency-converter/page.tsx` | Uses `/api/exchange-rate` |
| `/login` | `login/page.tsx` | Login form (`loginAction`) |
| `/subscribe` | `subscribe/page.tsx` | Subscription CTA |
| `/user` | `user/page.tsx` | Member dashboard (auth-gated) |
| `/advertise` | `advertise/page.tsx` | Advertise form |
| `/privacy`, `/terms` | `privacy/page.tsx`, `terms/page.tsx` | Legal pages (linked from footer) |
| `/simple`, `/notion-like` | `simple/`, `notion-like/` | Tiptap editor demos |

### Homepage

`app/(site)/(site-shell)/page.tsx`:

- Fetches hero articles (`getHeroArticles`) and up to 12 articles per category (`getArticlesByCategory`).
- Renders `HomeHeroSection` (featured + side + row, each with date) and a `HomeTopicCarousel` per category (only when a category has ≥ 2 articles).
- Each carousel card shows cover, title, excerpt, and **date**; the section header has **prev/next arrows** and a plain **«المزيد» hyperlink** to `/category/{slug}` (placed to the left of the arrows in RTL).

### Search

Client-side filtering over `getPublishedArticles()` (title + excerpt). Arabic text is
normalized (diacritics/tatweel stripped; alef/ya/ta-marbuta/hamza variants unified) so
`اسرائيل` matches `إسرائيل`. Articles without a cover image still render (image omitted).

## Fonts

- `app/fonts.ts` — `next/font/local`:
  - **Shubbak** (8 weights, `--font-shubbak`) — the site font.
  - **Neirizi** (`--font-neirizi`).
  - Files in `public/fonts/`.
- `app/globals.css`:
  - `--font-sans: var(--font-shubbak), …` and `--font-heading: var(--font-sans)`.
  - `html body { font-family: var(--font-sans); }` — neutralizes a **global** `body { font-family: "Inter" }` that Tiptap's stylesheet injects on article pages (Tiptap files themselves are untouched; editor internals keep their own fonts by specificity).
- **Admin text scale:** `.admin-scale { --text-*: calc(… * 1.1) }` (applied in `AdminLayoutShell`) scales all Tailwind `text-*` utilities in the admin by 10%.

## Components (public)

- `site-navbar.tsx`, `site-footer.tsx` — shell chrome.
- `home-hero.tsx`, `home-topic-carousel.tsx` — homepage.
- `category-page-view.tsx` — category listing.
- `news-article-view.tsx`, `article-tiptap-read-only.tsx`, `article-highlights.tsx`, `article-image-gallery.tsx`, `article-image-section.tsx` — article rendering (body is Tiptap JSON rendered read-only).
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
- `react-grab` (`//unpkg.com/react-grab/dist/index.global.js`) loads in **all** environments.
- Images served from R2 (`**.r2.dev`) and various news hosts; `remotePatterns` in `next.config.mjs`.
