"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

const CARDS = [
  {
    titleKey: "homeFinanceCard1Title" as const,
    excerptKey: "homeFinanceCard1Excerpt" as const,
    src: "https://images.unsplash.com/photo-1592355591829-aaae33fcff1d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    titleKey: "homeFinanceCard2Title" as const,
    excerptKey: "homeFinanceCard2Excerpt" as const,
    src: "https://images.unsplash.com/photo-1568191009535-7d8b407d389a?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    titleKey: "homeFinanceCard3Title" as const,
    excerptKey: "homeFinanceCard3Excerpt" as const,
    src: "https://images.unsplash.com/photo-1529912626516-e58b23f44f1d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    titleKey: "homeFinanceCard4Title" as const,
    excerptKey: "homeFinanceCard4Excerpt" as const,
    src: "https://images.unsplash.com/photo-1732594207742-1ee7a1bb561b?q=80&w=657&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
]

export function HomeFinanceSpotlight() {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = useState(false)
  /** حافة يسار الشاشة: يظهر بعد التمرير نحو البطاقات الأخيرة (يساراً في العربية) */
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

  /**
   * شريط ltr + flex-row-reverse: البطاقة الأولى في DOM تظهر يميناً، الأخيرة يساراً (قراءة عربية).
   * من xl: شبكة direction:rtl حتى يبقى العمود الأول من يمين الصف.
   */
  const scrollStep = (direction: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>("[data-finance-card]")
    const step = card?.offsetWidth ?? Math.min(el.clientWidth * 0.85, 320)
    el.scrollBy({ behavior: "smooth", left: direction * step * 0.92 })
  }

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
            {/* السابق = تمرير نحو البطاقة الأولى (يمين) */}
            <button
              type="button"
              disabled={!canScroll}
              aria-label={ar.homeFinanceNavPrev}
              onClick={() => scrollStep(1)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
            {/* التالي = تمرير نحو البطاقة الأخيرة (يسار) */}
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
            {CARDS.map((card, index) => (
              <FinanceCard
                key={card.titleKey}
                title={ar[card.titleKey]}
                excerpt={ar[card.excerptKey]}
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

function FinanceCard({
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
      <Link
        href="#"
        className="absolute inset-0 z-10 block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <span className="sr-only">
          {title} {excerpt}
        </span>
      </Link>

      <Image
        src={src}
        alt=""
        fill
        sizes="(max-width: 1279px) 82vw, 22vw"
        priority={priority}
        className="object-cover transition duration-700 ease-out will-change-transform"
      />

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
          {title}
        </h3>
        <p
          className={cn(
            "finance-card-excerpt mt-0 max-h-0 translate-y-2 overflow-hidden opacity-0 transition-all duration-300 ease-out text-pretty text-sm leading-relaxed text-white/95",
          )}
        >
          {excerpt}
        </p>
      </div>
    </article>
  )
}
