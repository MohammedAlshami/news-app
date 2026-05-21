import Image from "next/image"
import Link from "next/link"
import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ar } from "@/lib/ui-ar"

type Props = {
  title: string
  coverImageUrl: string | null
  back: { href: string; label: string }
}

export function SubscriptionPageGate({ title, coverImageUrl, back }: Props) {
  return (
    <div dir="rtl" lang="ar" className="flex min-h-[80vh] items-center justify-center bg-white px-4">
      <div className="w-full max-w-lg text-center">
        {coverImageUrl ? (
          <div className="relative mx-auto mb-8 aspect-[16/9] w-full max-w-sm overflow-hidden rounded-2xl bg-neutral-100">
            <Image
              src={coverImageUrl}
              alt=""
              fill
              className="object-cover opacity-40 blur-sm"
              sizes="(max-width: 640px) 100vw, 400px"
            />
          </div>
        ) : null}

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Lock className="h-8 w-8 text-amber-600" />
        </div>

        <h1 className="mb-3 text-2xl font-bold text-neutral-900">{ar.adminArticleMemberOnlyToggle}</h1>

        <p className="mb-2 text-lg font-semibold text-neutral-800">{title}</p>

        <p className="mb-8 text-sm leading-relaxed text-neutral-500">
          {ar.adminArticleMemberOnlyModalDesc}
        </p>

        <div className="mx-auto mb-8 max-w-xs rounded-xl border border-border bg-muted/50 p-4">
          <p className="text-3xl font-bold">٩٫٩٩</p>
          <p className="text-sm text-muted-foreground">دولار / شهرياً</p>
          <ul className="mt-4 space-y-2 text-right text-sm">
            <li className="flex items-center gap-2">✓ جميع المقالات الحصرية</li>
            <li className="flex items-center gap-2">✓ محتوى مميز بدون إعلانات</li>
            <li className="flex items-center gap-2">✓ إشعارات فورية بالأخبار العاجلة</li>
          </ul>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button size="lg" className="w-full max-w-xs">
            اشترك الآن
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={back.href}>{back.label}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
