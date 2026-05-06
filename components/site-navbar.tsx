"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Search, User } from "lucide-react"

import { ALL_CATEGORIES_ID, getCategoryPagePath } from "@/lib/site-routes"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

const navLinkClass = "text-[15px] font-bold text-gray-800 transition-colors hover:text-black"

/** أثناء التمرير داخل أعلى الصفحة (البطل) لا يُفعّل الإخفاء عند النزول حتى يتجاوز المستخدم هذا المقدار. */
const AUTO_HIDE_AFTER_SCROLL_PX = 440
/** دائماً يظهر الشريط عند التمرير قرب أعلى المستند */
const ALWAYS_VISIBLE_NEAR_TOP_PX = 12
/** يقلّل الاهتزاز من عجلة التتبّع الدقيقة */
const SCROLL_DIRECTION_MIN_DELTA = 10

/** Scroll-direction header: يختفي عند النزول، يظهر عند الصعود (auto-hide / smart navbar). */
export function SiteNavbar() {
  const allNewsHref = getCategoryPagePath(ALL_CATEGORIES_ID)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY

    const onScroll = () => {
      const y = window.scrollY
      const prev = lastY.current
      const delta = y - prev

      lastY.current = y

      if (y <= ALWAYS_VISIBLE_NEAR_TOP_PX) {
        setHidden(false)
        return
      }

      if (y < AUTO_HIDE_AFTER_SCROLL_PX) {
        setHidden(false)
        return
      }

      if (Math.abs(delta) < SCROLL_DIRECTION_MIN_DELTA) {
        return
      }

      if (delta > 0) {
        setHidden(true)
      } else {
        setHidden(false)
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      dir="rtl"
      lang="ar"
      aria-label={ar.newsBrand}
      className={cn(
        "fixed inset-x-0 top-2 z-50 w-full will-change-transform",
        "transform-gpu transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
        hidden && "-translate-y-[calc(100%+16px)] pointer-events-none",
      )}
    >
      <div className="mx-auto w-full max-w-[90rem] px-6 pb-2 pt-2 md:px-12 md:pb-2 md:pt-3">
        <div className="w-full rounded-full border border-gray-100 bg-white px-5 py-3 md:px-10 md:py-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-8 lg:gap-10">
              <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-black">
                  <div className="h-2.5 w-2.5 rounded-sm bg-white" />
                </div>
                <span className="text-3xl font-black leading-none tracking-tighter text-gray-900">
                  {ar.siteMark}
                </span>
              </Link>

              <div className="hidden items-center gap-8 text-[15px] font-bold text-gray-800 lg:flex">
                <Link href={allNewsHref} className={navLinkClass}>
                  {ar.navPrimaryNews}
                </Link>
                <Link href="#" className={navLinkClass}>
                  {ar.navPrimaryShows}
                </Link>
                <Link href="#" className={navLinkClass}>
                  {ar.navPrimaryForum}
                </Link>
                <Link href="#" className={navLinkClass}>
                  {ar.navPrimaryLive}
                </Link>
                <Link href="#" className={navLinkClass}>
                  {ar.navPrimaryLocal}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-6 text-[15px] font-bold text-gray-800">
              <button
                type="button"
                className="flex items-center gap-2 transition-opacity hover:opacity-70"
                aria-label={ar.navSearchAria}
              >
                <Search className="h-5 w-5 stroke-[2.5]" aria-hidden />
                <span className="hidden sm:inline">{ar.navSearch}</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 transition-opacity hover:opacity-70"
                aria-label={ar.navAccountAria}
              >
                <User className="h-5 w-5 stroke-[2.5]" aria-hidden />
                <span className="hidden sm:inline">{ar.navAccount}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
