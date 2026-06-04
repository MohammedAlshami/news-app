"use client"

import { useState } from "react"
import Link from "next/link"

import { ar } from "@/lib/ui-ar"
import { Globe } from "@/components/ui/globe"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { X } from "lucide-react"

const STAR_COUNT = 18

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function SiteSubscribeBanner() {
  const [open, setOpen] = useState(false)

  const rand = seededRandom(42)
  const stars = Array.from({ length: STAR_COUNT }, (_, i) => {
    const size = rand() < 0.4 ? 3 : 2
    return {
      size,
      top: `${rand() * 90}%`,
      left: `${rand() * 95}%`,
      opacity: 0.3 + rand() * 0.5,
      duration: `${2 + rand() * 2}s`,
      delay: `${rand() * 2}s`,
    }
  })

  return (
    <>
      <aside
        dir="rtl"
        lang="ar"
        aria-labelledby="site-subscribe-banner-heading"
        className="w-full bg-white px-6 pt-12 md:px-12 md:pt-16 lg:pt-20"
      >
        <div className="mx-auto max-w-[90rem]">
          <div
            className="relative overflow-hidden rounded-3xl"
            style={{
              background: "linear-gradient(135deg, #0d4a6e 0%, #0a6b8a 40%, #0e8fa8 70%, #1aa3b8 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style={{ zIndex: 1 }}
            >
              {stars.map((s, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    width: `${s.size}px`,
                    height: `${s.size}px`,
                    borderRadius: "50%",
                    background: `rgba(255, 255, 255, ${s.opacity})`,
                    top: s.top,
                    left: s.left,
                    animation: `twinkle ${s.duration} ease-in-out infinite alternate`,
                    animationDelay: s.delay,
                  }}
                />
              ))}
            </div>

            <div
              className="relative flex min-h-[300px] items-center justify-between gap-8 px-8 py-8 sm:px-10 md:px-14"
              style={{ zIndex: 2 }}
            >
              <div className="min-w-0 flex-1 text-center md:text-right">
                <h2
                  id="site-subscribe-banner-heading"
                  className="text-pretty text-2xl font-bold leading-tight text-white md:text-3xl"
                >
                  {ar.siteSubscribeBannerTitle}
                </h2>
                <p className="mt-2 max-w-xl text-pretty text-[15px] leading-relaxed text-white/85 md:text-base">
                  {ar.siteSubscribeBannerDescription}
                </p>
                <p className="mt-4 text-3xl font-bold text-white">$2 فقط</p>
                <button
                  onClick={() => setOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-8 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-80"
                >
                  {ar.siteSubscribeBannerCta}
                </button>
              </div>
              <Globe className="absolute left-[-90%] top-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[500px] md:h-[500px] pointer-events-none" />
            </div>
          </div>
        </div>
      </aside>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          dir="rtl"
          className="sm:max-w-2xl rounded-3xl border-0 p-0 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0d4a6e 0%, #0a6b8a 40%, #0e8fa8 70%, #1aa3b8 100%)",
          }}
        >
          <DialogTitle className="sr-only">{ar.siteSubscribeBannerTitle}</DialogTitle>
          <button
            onClick={() => setOpen(false)}
            className="absolute left-4 top-4 z-10 rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-white/30"
          >
            <X className="h-4 w-4" />
          </button>
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            {stars.map((s, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  borderRadius: "50%",
                  background: `rgba(255, 255, 255, ${s.opacity})`,
                  top: s.top,
                  left: s.left,
                  animation: `twinkle ${s.duration} ease-in-out infinite alternate`,
                  animationDelay: s.delay,
                }}
              />
            ))}
          </div>
          <div className="relative px-8 py-12 text-center">
            <h3 className="text-2xl font-bold text-white">{ar.siteSubscribeBannerTitle}</h3>
            <p className="mt-2 text-[15px] text-white/85">{ar.siteSubscribeBannerDescription}</p>
            <p className="mt-6 text-4xl font-bold text-white">$2 فقط</p>
            <p className="mt-1 text-sm text-white/70">شهرياً</p>
            <ul className="mt-6 space-y-3 text-right">
              <li className="flex items-center gap-2 text-sm text-white/90">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] text-white">✓</span>
                جميع المقالات الحصرية
              </li>
              <li className="flex items-center gap-2 text-sm text-white/90">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] text-white">✓</span>
                محتوى مميز بدون إعلانات
              </li>
              <li className="flex items-center gap-2 text-sm text-white/90">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] text-white">✓</span>
                إشعارات فورية بالأخبار العاجلة
              </li>
            </ul>
            <button
              onClick={() => setOpen(false)}
              className="mt-8 w-full rounded-full bg-black px-8 py-3.5 text-center text-sm font-bold text-white transition-opacity hover:opacity-80"
            >
              {ar.siteSubscribeBannerCta}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}