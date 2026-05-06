import Link from "next/link"
import { ArrowUpLeft } from "lucide-react"

import { ar } from "@/lib/ui-ar"

export function SiteSubscribeBanner() {
  return (
    <aside
      dir="rtl"
      lang="ar"
      aria-labelledby="site-subscribe-banner-heading"
      className="w-full bg-white px-6 py-12 md:px-12 md:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[90rem]">
        <div className="flex flex-col items-stretch justify-between gap-8 rounded-3xl bg-neutral-900 px-8 py-14 text-white shadow-sm sm:px-10 sm:py-16 md:flex-row md:items-center md:gap-10 md:px-14 md:py-20 lg:py-24">
          <div className="min-w-0 flex-1 space-y-2 text-right">
            <h2
              id="site-subscribe-banner-heading"
              className="text-pretty text-2xl font-bold tracking-tight md:text-3xl"
            >
              {ar.siteSubscribeBannerTitle}
            </h2>
            <p className="max-w-xl text-pretty text-[15px] leading-relaxed text-neutral-300 md:text-base">
              {ar.siteSubscribeBannerDescription}
            </p>
          </div>
          <div className="shrink-0 md:ps-4">
            <Link
              href="#"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-center text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-100 md:w-auto md:min-w-[12rem]"
            >
              {ar.siteSubscribeBannerCta}
              <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
