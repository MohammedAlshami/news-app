import type { Metadata } from "next"
import Link from "next/link"

import { ar } from "@/lib/ui-ar"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `اشتراك | ${ar.newsBrand}`,
  description: "اشترك الآن وتمتع بجميع المقالات الحصرية والمحتوى المميز.",
}

export default function SubscribePage() {
  return (
    <div dir="rtl" lang="ar" className="min-h-svh bg-white">
      <div className="mx-auto w-full max-w-[90rem] px-4 py-20 sm:px-6 md:px-10">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-bold text-neutral-900 md:text-4xl">
            {ar.siteSubscribeBannerTitle}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-500">
            {ar.siteSubscribeBannerDescription}
          </p>
          <div className="mt-10 rounded-3xl border border-neutral-100 p-8 text-right">
            <p className="text-center text-4xl font-bold text-neutral-900">$2</p>
            <p className="mt-1 text-center text-sm text-neutral-500">شهرياً</p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-sm text-neutral-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs text-white">✓</span>
                جميع المقالات الحصرية
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs text-white">✓</span>
                محتوى مميز بدون إعلانات
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs text-white">✓</span>
                إشعارات فورية بالأخبار العاجلة
              </li>
            </ul>
            <button className="mt-8 w-full rounded-full bg-black py-3.5 text-center text-sm font-bold text-white transition-opacity hover:opacity-80">
              {ar.siteSubscribeBannerCta}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
