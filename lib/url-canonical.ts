const TRACKING_PARAMS = /^(utm_[a-z]+|fbclid|gclid|mc_cid|mc_eid|ref|ref_src|igshid|_ga|cmpid|ocid)$/i

/**
 * Drop fragments and tracking params, lower-case the host. Deliberately string-based:
 * it never re-encodes the path or touches a trailing slash, so it maps every URL already
 * stored in `scraped_news` to itself (a different canonical form would make the same
 * article look "new" and re-insert it).
 */
export function canonicalizeUrl(input: string): string {
  let u = (input ?? "").trim()
  const hash = u.indexOf("#")
  if (hash >= 0) u = u.slice(0, hash)

  const q = u.indexOf("?")
  if (q >= 0) {
    const kept = u
      .slice(q + 1)
      .split("&")
      .filter((p) => p && !TRACKING_PARAMS.test(p.split("=")[0]))
    u = u.slice(0, q) + (kept.length ? `?${kept.join("&")}` : "")
  }

  return u.replace(/^(https?:\/\/)([^/?]+)/i, (_m, scheme: string, host: string) => scheme.toLowerCase() + host.toLowerCase())
}
