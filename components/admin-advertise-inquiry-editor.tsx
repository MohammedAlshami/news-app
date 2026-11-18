"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { type AdminAdvertiseInquiryPayload, updateAdvertiseInquiryAction } from "@/app/admin/advertise/actions"
import { Button } from "@/components/ui/button"
import { formatArticleDate } from "@/lib/format-date"
import { ar } from "@/lib/ui-ar"

function statusLabel(s: string): string {
  if (s === "new") return ar.adminAdvertiseStatusNew
  if (s === "read") return ar.adminAdvertiseStatusRead
  if (s === "archived") return ar.adminAdvertiseStatusArchived
  return s
}

type Props = {
  initial: AdminAdvertiseInquiryPayload
}

/** Inquiry detail for `/admin/advertise/[id]`: the request plus a status switch and internal notes. */
export function AdminAdvertiseInquiryEditor({ initial }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(initial.status)
  const [notes, setNotes] = useState(initial.adminNotes ?? "")
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const save = () =>
    startTransition(async () => {
      const r = await updateAdvertiseInquiryAction(initial.id, status, notes)
      setMessage(r.ok ? { ok: true, text: "تم الحفظ." } : { ok: false, text: r.error })
      if (r.ok) router.refresh()
    })

  return (
    <div className="space-y-8">
    <dl className="space-y-4 text-sm">
      <div>
        <dt className="font-medium text-foreground">{ar.adminAdvertiseFieldStatus}</dt>
        <dd className="mt-1 text-muted-foreground">{statusLabel(initial.status)}</dd>
      </div>
      <div>
        <dt className="font-medium text-foreground">{ar.advertiseFieldName}</dt>
        <dd className="mt-1 text-muted-foreground">{initial.name}</dd>
      </div>
      <div>
        <dt className="font-medium text-foreground">{ar.advertiseFieldEmail}</dt>
        <dd className="mt-1 break-all text-start text-muted-foreground">
          <span dir="ltr" className="inline-block max-w-full">
            {initial.email}
          </span>
        </dd>
      </div>
      {initial.phone ? (
        <div>
          <dt className="font-medium text-foreground">{ar.adminAdvertiseFieldPhone}</dt>
          <dd className="mt-1 text-start text-muted-foreground">
            <span dir="ltr" className="inline-block max-w-full">
              {initial.phone}
            </span>
          </dd>
        </div>
      ) : null}
      {initial.company ? (
        <div>
          <dt className="font-medium text-foreground">{ar.adminAdvertiseFieldCompany}</dt>
          <dd className="mt-1 text-muted-foreground">{initial.company}</dd>
        </div>
      ) : null}
      <div>
        <dt className="font-medium text-foreground">{ar.adminAdvertiseFieldMessage}</dt>
        <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">
          {initial.message}
        </dd>
      </div>
      <div>
        <dt className="font-medium text-foreground">{ar.adminAdvertiseFieldCreated}</dt>
        <dd className="mt-1 text-muted-foreground">
          <time dateTime={initial.createdAtIso.slice(0, 10)}>
            {formatArticleDate(initial.createdAtIso.slice(0, 10))}
          </time>
        </dd>
      </div>
    </dl>
    <div className="max-w-xl space-y-4 rounded-lg border bg-card p-4">
      <div className="space-y-2">
        <span className="text-sm font-medium">{ar.adminAdvertiseFieldStatus}</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={ar.adminAdvertiseFieldStatus}>
          {(["new", "read", "archived"] as const).map((s) => (
            <Button key={s} type="button" size="sm" variant={status === s ? "default" : "outline"} role="radio" aria-checked={status === s} onClick={() => setStatus(s)}>
              {statusLabel(s)}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="inq-notes" className="text-sm font-medium">{ar.adminAdvertiseFieldNotes}</label>
        <textarea
          id="inq-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={4000}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>حفظ</Button>
        {message ? <span className={message.ok ? "text-sm text-green-600" : "text-sm text-destructive"}>{message.text}</span> : null}
      </div>
    </div>
    </div>
  )
}
