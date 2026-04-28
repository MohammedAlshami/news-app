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
  images: {
    remotePatterns: [
      ...r2Patterns,
      { protocol: "https", hostname: "**.r2.dev", port: "", pathname: "/**" },
    ],
  },
}

export default nextConfig
