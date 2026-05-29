"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Home, Landmark, Menu, Newspaper, Search, Trophy, User, X } from "lucide-react"

import { ALL_CATEGORIES_ID, getCategoryPagePath } from "@/lib/site-routes"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

const navLinkClass = "text-[15px] font-bold text-gray-800 transition-colors hover:text-black"

export type SiteNavbarLink = {
  id: string
  label: string
  href: string
}

type SiteNavbarProps = {
  primaryLinks: SiteNavbarLink[]
}

/** Scroll-direction header: hides on scroll down and shows on scroll up. */
export function SiteNavbar({ primaryLinks }: SiteNavbarProps) {
  const allNewsHref = getCategoryPagePath(ALL_CATEGORIES_ID)
  const [hidden, setHidden] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY

    const onScroll = () => {
      const y = window.scrollY
      const prev = lastY.current
      const delta = y - prev

      lastY.current = y

      if (y <= 12) {
        setHidden(false)
        return
      }

      if (y < 440) {
        setHidden(false)
        return
      }

      if (Math.abs(delta) < 10) {
        return
      }

      setHidden(delta > 0)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <motion.nav
      dir="rtl"
      lang="ar"
      aria-label={ar.newsBrand}
      className={cn(
        "fixed inset-x-0 top-2 z-50 w-full",
        hidden && "pointer-events-none",
      )}
      animate={{ y: hidden ? "-120%" : 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="mx-auto w-full max-w-[90rem] px-6 pb-2 pt-2 md:px-12 md:pb-2 md:pt-3">
        <div className="w-full rounded-full border border-gray-100 bg-white px-5 py-3 md:px-10 md:py-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-8 lg:gap-10">
              <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <span className="text-3xl font-black leading-none tracking-tighter text-gray-900">
                  {ar.siteMark}
                </span>
              </Link>

              <div className="hidden items-center gap-8 text-[15px] font-bold text-gray-800 lg:flex">
                <Link href={allNewsHref} className={navLinkClass}>
                  {ar.navPrimaryNews}
                </Link>
                {primaryLinks.map((item) => (
                  <Link key={item.href} href={item.href} className={navLinkClass}>
                    {item.label}
                  </Link>
                ))}
                <Link href="/advertise" className={navLinkClass}>
                  {ar.footerAdvertise}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4 lg:hidden">
              <Link
                href="/admin"
                className="transition-opacity hover:opacity-70"
                aria-label={ar.navAccountAria}
              >
                <User className="h-5 w-5 stroke-[2.5]" aria-hidden />
              </Link>
              <button
                onClick={() => setSidebarOpen(true)}
                className="transition-opacity hover:opacity-70"
                aria-label="القائمة"
              >
                <Menu className="h-5 w-5 stroke-[2.5]" aria-hidden />
              </button>
            </div>
            <div className="hidden items-center gap-6 text-[15px] font-bold text-gray-800 lg:flex">
              <Link
                href="/search"
                className="flex items-center gap-2 transition-opacity hover:opacity-70"
                aria-label={ar.navSearchAria}
              >
                <Search className="h-5 w-5 stroke-[2.5]" aria-hidden />
                <span className="hidden sm:inline">{ar.navSearch}</span>
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-2 transition-opacity hover:opacity-70"
                aria-label={ar.navAccountAria}
              >
                <User className="h-5 w-5 stroke-[2.5]" aria-hidden />
                <span className="hidden sm:inline">{ar.navAccount}</span>
              </Link>
              <Link
                href="#"
                className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-80"
              >
                {ar.siteSubscribeBannerTitle}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
    <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
      <div className="mx-auto w-full max-w-[90rem] px-6 pb-2 pt-2">
        <div className="w-full rounded-full border border-gray-100 bg-white px-5 py-3">
          <div className="flex items-center justify-around">
            <Link
              href="/"
              className="flex flex-col items-center gap-0.5 text-gray-800 transition-opacity hover:opacity-70"
            >
              <Home className="h-5 w-5 stroke-[2.5]" aria-hidden />
              <span className="text-[10px] font-bold">{ar.home}</span>
            </Link>
            <Link
              href={allNewsHref}
              className="flex flex-col items-center gap-0.5 text-gray-800 transition-opacity hover:opacity-70"
            >
              <Newspaper className="h-5 w-5 stroke-[2.5]" aria-hidden />
              <span className="text-[10px] font-bold">{ar.navPrimaryNews}</span>
            </Link>
            {primaryLinks[0] && (
              <Link
                href={primaryLinks[0].href}
                className="flex flex-col items-center gap-0.5 text-gray-800 transition-opacity hover:opacity-70"
              >
                <Landmark className="h-5 w-5 stroke-[2.5]" aria-hidden />
                <span className="text-[10px] font-bold">{primaryLinks[0].label}</span>
              </Link>
            )}
            {primaryLinks[1] && (
              <Link
                href={primaryLinks[1].href}
                className="flex flex-col items-center gap-0.5 text-gray-800 transition-opacity hover:opacity-70"
              >
                <Trophy className="h-5 w-5 stroke-[2.5]" aria-hidden />
                <span className="text-[10px] font-bold">{primaryLinks[1].label}</span>
              </Link>
            )}
            <Link
              href="/search"
              className="flex flex-col items-center gap-0.5 text-gray-800 transition-opacity hover:opacity-70"
              aria-label={ar.navSearchAria}
            >
              <Search className="h-5 w-5 stroke-[2.5]" aria-hidden />
              <span className="text-[10px] font-bold">{ar.navSearch}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
    <AnimatePresence>
      {sidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 top-0 z-50 w-72 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b p-4">
              <span className="text-lg font-bold text-gray-900">{ar.newsBrand}</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="transition-opacity hover:opacity-70"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>
            <div className="flex flex-col gap-1 p-4">
              <Link
                href={allNewsHref}
                className="rounded-lg px-3 py-2.5 text-[15px] font-bold text-gray-800 transition-colors hover:bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                {ar.navPrimaryNews}
              </Link>
              {primaryLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2.5 text-[15px] font-bold text-gray-800 transition-colors hover:bg-gray-100"
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/advertise"
                className="rounded-lg px-3 py-2.5 text-[15px] font-bold text-gray-800 transition-colors hover:bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                {ar.footerAdvertise}
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
    </>
  )
}
