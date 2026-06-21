"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search } from "lucide-react"

import { formatArticleDate } from "@/lib/format-date"
import { getArticlePath } from "@/lib/site-routes"
import { ar } from "@/lib/ui-ar"

type Article = {
  id: string
  title: string
  excerpt: string
  date: string
  categoryIds: string[]
  coverImageUrl?: string | null
  isMemberOnly: boolean
}

type Props = {
  articles: Article[]
  initialQuery: string
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export default function SearchClient({ articles, initialQuery }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const inputRef = useRef<HTMLInputElement>(null)
  const normalizedQuery = normalize(query)

  const filtered = useMemo(() => {
    if (!normalizedQuery) return []
    return articles.filter((a) => {
      const haystack = normalize([a.title, a.excerpt].join(" "))
      return haystack.includes(normalizedQuery)
    })
  }, [articles, normalizedQuery])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = inputRef.current?.value ?? ""
    setQuery(val)
    const url = val.trim() ? `/search?q=${encodeURIComponent(val.trim())}` : "/search"
    window.history.pushState({}, "", url)
  }

  return (
    <div className="min-h-0 min-w-0 flex-1 bg-white">
      <div dir="rtl" lang="ar" className="mx-auto w-full max-w-[90rem] px-4 py-12 sm:px-6 md:px-10 md:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-pretty text-3xl font-black tracking-tight text-neutral-900 md:text-5xl">
            {ar.searchTitle}
          </h1>
          <p className="mt-4 text-[15px] leading-7 text-neutral-500 md:text-base">
            {ar.searchDescription}
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm md:flex-row md:items-center">
              <input
                ref={inputRef}
                defaultValue={initialQuery}
                placeholder={ar.searchPlaceholder}
                className="h-14 flex-1 rounded-xl border-0 bg-neutral-50 px-5 text-right text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-neutral-300"
              />
              <button
                type="submit"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #0d4a6e 0%, #0a6b8a 40%, #0e8fa8 70%, #1aa3b8 100%)",
                }}
              >
                <Search className="h-4 w-4" />
                {ar.searchButton}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-12">
          {!query ? (
            <p className="text-center text-sm leading-7 text-neutral-500">
              {ar.searchEmptyState}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm leading-7 text-neutral-500">
              {ar.searchNoResults}
            </p>
          ) : (
            <div className="mx-auto max-w-3xl space-y-3">
              {filtered.map((article) => {
                const imgSrc = article.coverImageUrl?.trim()
                if (!imgSrc) return null
                return (
                  <Link
                    key={article.id}
                    href={getArticlePath(article.id)}
                    className="group flex items-center gap-4 rounded-xl border border-neutral-100 px-5 py-4 text-right transition-colors hover:bg-neutral-50"
                  >
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      <Image
                        src={imgSrc}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold leading-snug text-neutral-900 transition-colors group-hover:text-neutral-700">
                        {article.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-neutral-500">
                        {article.excerpt}
                      </p>
                      <time className="mt-2 block text-xs text-neutral-400">
                        {formatArticleDate(article.date)}
                      </time>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
