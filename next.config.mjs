import { readFileSync } from "node:fs"

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"

// Makes Cloudflare bindings (D1 `DB`, R2 `MEDIA`) available under `next dev`.
// Skipped during production builds (`next build` / opennextjs-cloudflare build),
// which don't need bindings and must not open remote proxy sessions.
if (process.env.NODE_ENV !== "production") {
  initOpenNextCloudflareForDev()
}

const isDev = process.env.NODE_ENV !== "production"

/**
 * Public R2 base URL: build-time env first, then the `[vars]` entry in wrangler.toml (the single source
 * of truth for the deployed Worker), so `images.remotePatterns` pins the exact bucket host.
 */
function resolveR2PublicUrl() {
  if (process.env.R2_PUBLIC_URL) return process.env.R2_PUBLIC_URL
  try {
    const toml = readFileSync(new URL("./wrangler.toml", import.meta.url), "utf8")
    return toml.match(/^\s*R2_PUBLIC_URL\s*=\s*"([^"]+)"/m)?.[1]
  } catch {
    return undefined
  }
}

const r2Patterns = []
try {
  const base = resolveR2PublicUrl()
  if (base) {
    const u = new URL(base)
    r2Patterns.push({ protocol: "https", hostname: u.hostname, port: "", pathname: "/**" })
  }
} catch {
  // ignore invalid R2_PUBLIC_URL at build time
}

/**
 * CSP notes: Next's App Router streams inline bootstrap scripts (`self.__next_f.push(...)`) and uses
 * inline styles (next/font, chart theming), and there is no per-request nonce here (it would force
 * every page dynamic and defeat caching), so script-src/style-src need 'unsafe-inline'. 'unsafe-eval'
 * is only added for `next dev` (React refresh). Everything else is locked down.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
]

const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    // Uploads are capped at 5MB in `lib/upload-sniff.ts`; leave headroom for multipart overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
  images: {
    remotePatterns: [
      ...r2Patterns,
      { protocol: "https", hostname: "images.unsplash.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "plus.unsplash.com", port: "", pathname: "/**" },
      /** Covers BBC iChef (e.g. imported article covers from BBC export). */
      { protocol: "https", hostname: "**.bbci.co.uk", port: "", pathname: "/**" },
      { protocol: "https", hostname: "mf.b37mrtl.ru", port: "", pathname: "/**" },
      { protocol: "https", hostname: "img.youm7.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "**.youm7.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "aawsat.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "**.aawsat.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "alquds.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "**.alquds.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "aajeg.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "elwatannews.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "skynewsarabia.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "www.aajae.co", port: "", pathname: "/**" },
      { protocol: "https", hostname: "**.aajae.co", port: "", pathname: "/**" },
    ],
  },
}

export default nextConfig
