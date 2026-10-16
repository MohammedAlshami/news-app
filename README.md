# News App / Satellite Demo

A Next.js app experimenting with location-based news cards and Mapbox satellite
imagery (static previews per lat/lon). Built for a UMHack-style hackathon/demo.

- Interactive map previews using Mapbox static images
- News list pages with region filters
- Cloudflare/OpenNext + Wrangler deployment scripts
- Optional Playwright visual tests (helpers excluded from the public tree)

## Tech stack

- Next.js 15, React 19, TypeScript
- Tailwind, Radix/shadcn UI
- Mapbox (satellite tiles)
- Cloudflare Workers/OpenNext hosting

## Getting started

```bash
npm install
npm run dev   # http://localhost:3000
```

Set env vars via `.env.local`:

```ini
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_OPENAI_API_KEY=
# and vendor keys in .env
```

## Notes

- Build artifacts (`.next/`, `.open-next/`, `.wrangler/`, `playwright-report/`) are intentionally excluded.
