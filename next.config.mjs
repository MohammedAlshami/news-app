/** @type {import('next').NextConfig} */
const r2Patterns = []
const base = process.env.R2_PUBLIC_URL
if (base) {
  try {
    const u = new URL(base)
    r2Patterns.push({
      protocol: "https",
      hostname: u.hostname,
      port: "",
      pathname: "/**",
    })
  } catch {
    // ignore invalid R2_PUBLIC_URL at build time
  }
}

const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      ...r2Patterns,
      { protocol: "https", hostname: "**.r2.dev", port: "", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "plus.unsplash.com", port: "", pathname: "/**" },
      /** Covers BBC iChef (e.g. imported article covers from BBC export). */
      { protocol: "https", hostname: "**.bbci.co.uk", port: "", pathname: "/**" },
      { protocol: "https", hostname: "mf.b37mrtl.ru", port: "", pathname: "/**" },
    ],
  },
}

export default nextConfig
