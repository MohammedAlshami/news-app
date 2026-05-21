"use client"

import { Lock } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

type Props = {
  isMemberOnly: boolean
  isSubscribed: boolean
  href: string
  children: React.ReactNode
  className?: string
}

export function SubscriptionGate({ isMemberOnly, isSubscribed, href, children, className }: Props) {
  const [showDialog, setShowDialog] = useState(false)

  if (!isMemberOnly || isSubscribed) {
    return (
      <Link href={href} className={cn("relative", className)}>
        {isMemberOnly ? (
          <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
            <Lock className="size-3" />
            {ar.adminArticleMemberOnlyToggle}
          </div>
        ) : null}
        {children}
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className={cn("group relative cursor-pointer text-right", className)}
      >
        <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
          <Lock className="size-3" />
          {ar.adminArticleMemberOnlyToggle}
        </div>
        {children}
      </button>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>هذا المقال للمشتركين فقط</DialogTitle>
            <DialogDescription>
              اشترك الآن للوصول إلى جميع المقالات الحصرية والمحتوى المميز.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-2 py-4">
            <div className="rounded-xl border border-border bg-muted/50 p-4 text-center">
              <p className="text-3xl font-bold">٩٫٩٩</p>
              <p className="text-sm text-muted-foreground">دولار / شهرياً</p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">✓ جميع المقالات الحصرية</li>
              <li className="flex items-center gap-2">✓ محتوى مميز بدون إعلانات</li>
              <li className="flex items-center gap-2">✓ إشعارات فورية بالأخبار العاجلة</li>
            </ul>
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              لاحقاً
            </Button>
            <Button>اشترك الآن</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
