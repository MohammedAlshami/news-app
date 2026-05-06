"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export type TopicCarouselCard = {
  title: string
  excerpt: string
  src: string
}

type HomeTopicCarouselProps = {
  headingId: string
  title: string
  cards: TopicCarouselCard[]
  navPrevLabel: string
  navNextLabel: string
}

/** صف أفقي قابل للتمرير — بطاقات صورة + عنوان + ملخص (يُستخدَم لعدة أقسام في الصفحة الرئيسية). */
export function HomeTopicCarousel({
  headingId,
  title,
  cards,
  navPrevLabel,
  navNextLabel,
}: HomeTopicCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = useState(false)

  const measure = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setCanScroll(max > 2)
  }, [cards.length])

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

          <div className="flex shrink-0 justify-end gap-1.5 sm:justify-start">
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
            {cards.map((card, index) => (
              <TopicArticleCard
                key={`${headingId}-${index}`}
                title={card.title}
                excerpt={card.excerpt}
                src={card.src}
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
  title,
  excerpt,
  src,
  priority,
}: {
  title: string
  excerpt: string
  src: string
  priority?: boolean
}) {
  return (
    <article
      data-topic-carousel-card
      className="w-[min(88vw,360px)] shrink-0 snap-center sm:w-[min(82vw,380px)]"
    >
      <Link
        href="#"
        className="group block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-neutral-100">
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 640px) 88vw, 380px"
            priority={priority}
            className="object-cover transition duration-500 ease-out will-change-transform group-hover:scale-[1.03]"
          />
        </div>
        <div className="mt-4 space-y-2 px-0.5 text-right">
          <h3 className="text-pretty text-lg font-bold leading-snug text-neutral-900 transition group-hover:text-neutral-700 md:text-xl">
            {title}
          </h3>
          <p className="line-clamp-2 text-pretty text-sm leading-relaxed text-neutral-600 md:text-[15px]">
            {excerpt}
          </p>
        </div>
      </Link>
    </article>
  )
}
