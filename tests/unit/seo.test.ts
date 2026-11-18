import assert from "node:assert/strict"
import { afterEach, test } from "node:test"

import {
  DEFAULT_SITE_URL,
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildNewsArticleJsonLd,
  buildNewsSitemapXml,
  buildRssXml,
  buildSitemapXml,
  buildWebsiteJsonLd,
  escapeXml,
  jsonLdString,
  siteUrl,
} from "@/lib/seo"

const original = process.env.SITE_URL
afterEach(() => {
  if (original === undefined) delete process.env.SITE_URL
  else process.env.SITE_URL = original
})

test("siteUrl defaults, normalises and rejects junk", () => {
  delete process.env.SITE_URL
  assert.equal(siteUrl(), DEFAULT_SITE_URL)
  process.env.SITE_URL = "https://example.com/some/path/"
  assert.equal(siteUrl(), "https://example.com")
  process.env.SITE_URL = "javascript:alert(1)"
  assert.equal(siteUrl(), DEFAULT_SITE_URL)
  process.env.SITE_URL = "not a url"
  assert.equal(siteUrl(), DEFAULT_SITE_URL)
})

test("absoluteUrl joins paths and keeps absolute URLs", () => {
  process.env.SITE_URL = "https://example.com"
  assert.equal(absoluteUrl("/news/1"), "https://example.com/news/1")
  assert.equal(absoluteUrl("news/1"), "https://example.com/news/1")
  assert.equal(absoluteUrl("https://cdn.test/a.jpg"), "https://cdn.test/a.jpg")
})

test("jsonLdString cannot break out of a script tag", () => {
  const s = jsonLdString({ a: "</script><script>alert(1)</script>", b: "x&y " })
  assert.ok(!s.includes("<") && !s.includes(">") && !s.includes("&") && !s.includes(" "))
  assert.equal(JSON.parse(s).a, "</script><script>alert(1)</script>")
})

test("NewsArticle JSON-LD shape, member-only flag, breadcrumb, website", () => {
  process.env.SITE_URL = "https://example.com"
  const base = {
    path: "/news/abc",
    title: "عنوان الخبر",
    description: "وصف",
    images: ["/uploads/a.jpg"],
    datePublished: new Date("2026-01-02T03:04:05Z"),
    dateModified: new Date("2026-01-03T03:04:05Z"),
  }
  const free = buildNewsArticleJsonLd(base) as Record<string, any>
  assert.equal(free["@type"], "NewsArticle")
  assert.equal(free.inLanguage, "ar")
  assert.equal(free.isAccessibleForFree, true)
  assert.equal(free.hasPart, undefined)
  assert.deepEqual(free.image, ["https://example.com/uploads/a.jpg"])
  assert.equal(free.mainEntityOfPage["@id"], "https://example.com/news/abc")
  const paid = buildNewsArticleJsonLd({ ...base, memberOnly: true }) as Record<string, any>
  assert.equal(paid.isAccessibleForFree, false)
  assert.equal(paid.hasPart.isAccessibleForFree, false)
  const bc = buildBreadcrumbJsonLd([{ name: "أخبار", path: "/" }, { name: "x", path: "/category/x" }]) as Record<string, any>
  assert.equal(bc.itemListElement[1].item, "https://example.com/category/x")
  const ws = buildWebsiteJsonLd() as Record<string, any>[]
  assert.ok(ws[1].potentialAction.target.urlTemplate.endsWith("/search?q={search_term_string}"))
})

test("escapeXml escapes and strips control characters", () => {
  assert.equal(escapeXml(`a&b<c>"d"'e'\u0001`), "a&amp;b&lt;c&gt;&quot;d&quot;&apos;e&apos;")
  assert.equal(escapeXml("عربي"), "عربي")
})

test("sitemap XML escapes URLs and formats lastmod", () => {
  const xml = buildSitemapXml([
    { loc: "https://e.com/a?x=1&y=2", lastmod: new Date("2026-01-01T00:00:00Z"), priority: 0.8 },
  ])
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'))
  assert.ok(xml.includes("<loc>https://e.com/a?x=1&amp;y=2</loc>"))
  assert.ok(xml.includes("<lastmod>2026-01-01T00:00:00.000Z</lastmod>"))
  assert.ok(xml.includes("<priority>0.8</priority>"))
})

test("news sitemap carries Arabic title, publication and date", () => {
  const xml = buildNewsSitemapXml([{ loc: "https://e.com/news/1", title: "خبر & عاجل <1>", publishedAt: new Date("2026-01-01T00:00:00Z") }])
  assert.ok(xml.includes("xmlns:news="))
  assert.ok(xml.includes("<news:name>أخبار</news:name>"))
  assert.ok(xml.includes("<news:language>ar</news:language>"))
  assert.ok(xml.includes("<news:title>خبر &amp; عاجل &lt;1&gt;</news:title>"))
  assert.ok(xml.includes("<news:publication_date>2026-01-01T00:00:00.000Z</news:publication_date>"))
})

test("RSS builder: escaping, enclosure, RFC 822 date", () => {
  const xml = buildRssXml({
    title: "أخبار",
    link: "https://e.com",
    description: "d",
    selfUrl: "https://e.com/rss.xml",
    items: [
      { title: "a & b", link: "https://e.com/news/1", description: "نص <b>", pubDate: new Date("2026-01-01T00:00:00Z"), imageUrl: "https://e.com/i.png?x=1&y=2" },
    ],
  })
  assert.ok(xml.includes("<title>a &amp; b</title>"))
  assert.ok(xml.includes("<description>نص &lt;b&gt;</description>"))
  assert.ok(xml.includes('<enclosure url="https://e.com/i.png?x=1&amp;y=2" length="0" type="image/png"/>'))
  assert.ok(xml.includes("<pubDate>Thu, 01 Jan 2026 00:00:00 GMT</pubDate>"))
  assert.ok(xml.includes('rel="self"'))
})
