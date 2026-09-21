"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"

import { SubscriptionGate } from "@/components/subscription-gate"
import { getArticlePath } from "@/lib/site-routes"
import { formatArticleDate } from "@/lib/format-date"
import type { FeedArticle } from "@/lib/site-types"
import { cn } from "@/lib/utils"

type HomeTopicCarouselProps = {
  headingId: string
  title: string
  articles: FeedArticle[]
  categoryHref: string
  moreLabel: string
  navPrevLabel: string
  navNextLabel: string
  isSubscribed: boolean
}

export function HomeTopicCarousel({
  headingId,
  title,
  articles,
  categoryHref,
  moreLabel,
  navPrevLabel,
  navNextLabel,
  isSubscribed,
}: HomeTopicCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = useState(false)

  const measure = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setCanScroll(max > 2)
  }, [articles.length])

  useEffect(() => {
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [measure])

  const scrollStep = (direction: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>("[data-topic-carousel-card]")
    const step = card?.offsetWidth ?? Math.min(el.clientWidth * 0.88, 360)
    el.scrollBy({ behavior: "smooth", left: direction * step * 0.94 })
  }

  if (articles.length === 0) return null

  return (
    <section
      dir="rtl"
      lang="ar"
      className="bg-white py-12 md:py-16 lg:py-20"
      aria-labelledby={headingId}
    >
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8 xl:px-8 2xl:px-10">
        <header className="mb-8 flex flex-col gap-6 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id={headingId}
            className="text-pretty text-right text-2xl font-bold tracking-tight text-black md:text-3xl"
          >
            {title}
          </h2>

          <div className="flex shrink-0 items-center justify-end gap-3 sm:justify-start">
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={!canScroll}
                aria-label={navPrevLabel}
                onClick={() => scrollStep(1)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                disabled={!canScroll}
                aria-label={navNextLabel}
                onClick={() => scrollStep(-1)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            <Link
              href={categoryHref}
              className="inline-flex items-center gap-1 text-sm font-bold text-black underline-offset-4 transition-colors hover:underline"
            >
              {moreLabel}
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </header>

        <div>
          <div
            ref={scrollerRef}
            dir="ltr"
            onScroll={measure}
            className={cn(
              "flex flex-row-reverse gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none]",
              "snap-x snap-mandatory scroll-smooth sm:gap-5",
              "[&::-webkit-scrollbar]:hidden",
            )}
          >
            {articles.map((article, index) => (
              <TopicArticleCard
                key={article.id}
                article={article}
                isSubscribed={isSubscribed}
                priority={index === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TopicArticleCard({
  article,
  isSubscribed,
  priority,
}: {
  article: FeedArticle
  isSubscribed: boolean
  priority?: boolean
}) {
  const href = getArticlePath(article.id, article.title)

  return (
    <article
      data-topic-carousel-card
      className="w-[min(88vw,360px)] shrink-0 snap-center sm:w-[min(82vw,380px)]"
    >
      <SubscriptionGate
        isMemberOnly={article.isMemberOnly}
        isSubscribed={isSubscribed}
        href={href}
        className="group block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-neutral-100">
          {article.coverImageUrl ? (
            <Image
              src={article.coverImageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 88vw, 380px"
              priority={priority}
              className="object-cover transition duration-500 ease-out will-change-transform group-hover:scale-[1.03]"
            />
          ) : null}
        </div>
        <div className="mt-4 space-y-2 px-0.5 text-right">
          <h3 className="text-pretty text-lg font-bold leading-snug text-neutral-900 transition group-hover:text-neutral-700 md:text-xl">
            {article.title}
          </h3>
          <p className="line-clamp-2 text-pretty text-sm leading-relaxed text-neutral-600 md:text-[15px]">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100">
              <ExternalLink className="h-3 w-3 text-gray-500" aria-hidden />
            </div>
            <span className="text-[12px] font-medium text-gray-400">
              {formatArticleDate(article.date)}
            </span>
          </div>
        </div>
      </SubscriptionGate>
    </article>
  )
}
