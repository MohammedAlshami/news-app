"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { SubscriptionGate } from "@/components/subscription-gate"
import { getArticlePath } from "@/lib/site-routes"
import type { FeedArticle } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

type Props = {
  articles: FeedArticle[]
  isSubscribed: boolean
}

export function HomeFinanceSpotlight({ articles, isSubscribed }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = useState(false)
  const [fadeLeft, setFadeLeft] = useState(false)

  const measure = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const overflow = max > 2
    setCanScroll(overflow)
    if (!overflow) {
      setFadeLeft(false)
      return
    }
    const sl = Math.abs(el.scrollLeft)
    setFadeLeft(sl > 8)
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [measure])

  const scrollStep = (direction: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>("[data-finance-card]")
    const step = card?.offsetWidth ?? Math.min(el.clientWidth * 0.85, 320)
    el.scrollBy({ behavior: "smooth", left: direction * step * 0.92 })
  }

  if (articles.length === 0) return null

  return (
    <section
      dir="rtl"
      lang="ar"
      className="bg-white py-12 md:py-16 lg:py-20"
      aria-labelledby="home-finance-heading"
    >
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8 xl:px-8 2xl:px-10">
        <header className="mb-8 flex flex-col gap-6 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="home-finance-heading"
            className="text-pretty text-right text-2xl font-bold tracking-tight text-black md:text-3xl"
          >
            {ar.homeFinanceSectionTitle}
          </h2>

          <div className="flex shrink-0 justify-end gap-1.5 sm:justify-start">
            <button
              type="button"
              disabled={!canScroll}
              aria-label={ar.homeFinanceNavPrev}
              onClick={() => scrollStep(1)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              disabled={!canScroll}
              aria-label={ar.homeFinanceNavNext}
              onClick={() => scrollStep(-1)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </header>

        <div className="relative">
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 z-[15] w-14 bg-gradient-to-r from-black/55 via-black/15 to-transparent transition-opacity duration-300 sm:w-16 md:w-20 xl:hidden",
              fadeLeft ? "opacity-100" : "opacity-0",
            )}
          />

          <div
            ref={scrollerRef}
            dir="ltr"
            onScroll={measure}
            className={cn(
              "flex flex-row-reverse gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none]",
              "snap-x snap-mandatory scroll-smooth sm:gap-4",
              "xl:grid xl:grid-flow-row xl:grid-cols-4 xl:flex-none xl:gap-4 xl:overflow-visible xl:pb-0 xl:snap-none xl:[direction:rtl] 2xl:gap-5",
              "[&::-webkit-scrollbar]:hidden",
            )}
          >
            {articles.map((article, index) => (
              <FinanceCard
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

function FinanceCard({
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
      data-finance-card
      className={cn(
        "group relative aspect-[9/16] min-h-[380px] w-[min(82vw,320px)] shrink-0 snap-center overflow-hidden rounded-3xl bg-neutral-900",
        "sm:min-h-[460px] sm:w-[min(78vw,340px)]",
        "xl:aspect-auto xl:min-h-[540px] xl:w-auto xl:min-w-0",
        "focus-within:[&_.finance-card-excerpt]:mt-2 focus-within:[&_.finance-card-excerpt]:max-h-[14rem] focus-within:[&_.finance-card-excerpt]:translate-y-0 focus-within:[&_.finance-card-excerpt]:opacity-100",
        "hover:[&_.finance-card-excerpt]:mt-2 hover:[&_.finance-card-excerpt]:max-h-[14rem] hover:[&_.finance-card-excerpt]:translate-y-0 hover:[&_.finance-card-excerpt]:opacity-100",
        "focus-within:[&_img]:scale-105 hover:[&_img]:scale-105",
      )}
    >
      <SubscriptionGate
        isMemberOnly={article.isMemberOnly}
        isSubscribed={isSubscribed}
        href={href}
        className="absolute inset-0 z-10 block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <span className="sr-only">
          {article.title} {article.excerpt}
        </span>
      </SubscriptionGate>

      {article.coverImageUrl ? (
        <Image
          src={article.coverImageUrl}
          alt=""
          fill
          sizes="(max-width: 1279px) 82vw, 22vw"
          priority={priority}
          className="object-cover transition duration-700 ease-out will-change-transform"
        />
      ) : null}

      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent",
          "transition-opacity duration-300 group-hover:from-black/92 group-hover:via-black/45",
          "group-focus-within:from-black/92 group-focus-within:via-black/45",
        )}
      />

      <div
        dir="rtl"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] p-5 text-right md:p-6"
      >
        <h3 className="text-pretty text-lg font-bold leading-snug text-white drop-shadow-sm md:text-xl">
          {article.title}
        </h3>
        <p
          className={cn(
            "finance-card-excerpt mt-0 max-h-0 translate-y-2 overflow-hidden opacity-0 transition-all duration-300 ease-out text-pretty text-sm leading-relaxed text-white/95",
          )}
        >
          {article.excerpt}
        </p>
      </div>
    </article>
  )
}
