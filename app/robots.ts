import type { MetadataRoute } from "next"

import { absoluteUrl } from "@/lib/seo"

// Resolve SITE_URL at request time (Worker vars are not reliably present at build time).
export const dynamic = "force-dynamic"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/login", "/user", "/search", "/notion-like", "/simple"],
      },
    ],
    sitemap: [absoluteUrl("/sitemap.xml"), absoluteUrl("/news-sitemap.xml")],
  }
}
