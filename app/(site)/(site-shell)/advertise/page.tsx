import type { Metadata } from "next"

import { AdvertiseWithUsForm } from "@/components/advertise-with-us-form"
import { ar } from "@/lib/ui-ar"

export const metadata: Metadata = {
  title: ar.advertiseMetaTitle,
  description: ar.advertiseMetaDescription,
}

export default function AdvertisePage() {
  return (
    <div className="flex-1 bg-white">
      <div dir="rtl" lang="ar" className="mx-auto w-full max-w-[90rem] px-4 py-12 sm:px-6 md:px-10 md:py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                {ar.advertiseKicker}
              </span>
              <h1 className="mt-4 text-balance text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                {ar.advertisePageTitle}
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-[15px] leading-7 text-slate-600 md:text-base">
                {ar.advertiseIntro}
              </p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8 lg:p-10">
              <AdvertiseWithUsForm className="max-w-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
