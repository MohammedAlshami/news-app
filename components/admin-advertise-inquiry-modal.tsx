"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import {
  getAdminAdvertiseInquiryAction,
  type AdminAdvertiseInquiryPayload,
} from "@/app/admin/advertise/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatArticleDate } from "@/lib/format-date"
import { ar } from "@/lib/ui-ar"

function statusLabel(s: string): string {
  if (s === "new") return ar.adminAdvertiseStatusNew
  if (s === "read") return ar.adminAdvertiseStatusRead
  if (s === "archived") return ar.adminAdvertiseStatusArchived
  return s
}

type Props = {
  inquiryId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminAdvertiseInquiryModal({
  inquiryId,
  open,
  onOpenChange,
}: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AdminAdvertiseInquiryPayload | null>(null)

  useEffect(() => {
    if (!open || !inquiryId) {
      setData(null)
      setError(null)
      setPending(false)
      return
    }

    let cancelled = false
    setPending(true)
    setError(null)
    setData(null)

    void getAdminAdvertiseInquiryAction(inquiryId).then((r) => {
      if (cancelled) return
      setPending(false)
      if (r.ok === false) {
        setError(r.error)
        setData(null)
        return
      }
      setData(r.data)
    })

    return () => {
      cancelled = true
    }
  }, [open, inquiryId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="flex max-h-[92vh] max-w-[calc(100%-2rem)] min-w-0 flex-col gap-0 overflow-hidden p-0 pt-12 sm:max-w-lg"
        showCloseButton
      >
        <DialogTitle className="sr-only">{ar.adminAdvertiseView}</DialogTitle>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pb-6 pt-2">
          {pending ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-6 w-2/3 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : null}

          {!pending && error ? (
            <p className="py-8 text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {!pending && data ? (
            <div className="space-y-4 text-start">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {statusLabel(data.status)}
                </span>
                <time
                  className="text-xs text-muted-foreground"
                  dateTime={data.createdAtIso.slice(0, 10)}
                >
                  {formatArticleDate(data.createdAtIso.slice(0, 10))}
                </time>
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-foreground">{ar.advertiseFieldName}</dt>
                  <dd className="mt-0.5 text-muted-foreground">{data.name}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">{ar.advertiseFieldEmail}</dt>
                  <dd className="mt-0.5 break-all text-start text-muted-foreground">
                    <span dir="ltr" className="inline-block max-w-full">
                      {data.email}
                    </span>
                  </dd>
                </div>
                {data.phone ? (
                  <div>
                    <dt className="font-medium text-foreground">
                      {ar.adminAdvertiseFieldPhone}
                    </dt>
                    <dd className="mt-0.5 text-start text-muted-foreground">
                      <span dir="ltr" className="inline-block max-w-full">
                        {data.phone}
                      </span>
                    </dd>
                  </div>
                ) : null}
                {data.company ? (
                  <div>
                    <dt className="font-medium text-foreground">
                      {ar.adminAdvertiseFieldCompany}
                    </dt>
                    <dd className="mt-0.5 text-muted-foreground">{data.company}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="font-medium text-foreground">
                    {ar.adminAdvertiseFieldMessage}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">
                    {data.message}
                  </dd>
                </div>
              </dl>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/advertise/${data.id}`}>
                  {ar.adminAdvertiseOpenPage}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
