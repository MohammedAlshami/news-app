import type { Metadata } from "next"

import { AdvertiseWithUsForm } from "@/components/advertise-with-us-form"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: ar.advertiseMetaTitle,
  description: ar.advertiseMetaDescription,
}

export default function AdvertisePage() {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6",
      )}
    >
      <p className="text-sm font-medium text-muted-foreground">
        {ar.advertiseKicker}
      </p>
      <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight">
        {ar.advertisePageTitle}
      </h1>
      <p className="text-pretty mt-3 text-muted-foreground">
        {ar.advertiseIntro}
      </p>
      <div className="mt-8">
        <AdvertiseWithUsForm />
      </div>
    </div>
  )
}
