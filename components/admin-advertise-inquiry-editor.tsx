import type { AdminAdvertiseInquiryPayload } from "@/app/admin/advertise/actions"
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

/** Read-only inquiry detail for `/admin/advertise/[id]`. */
export function AdminAdvertiseInquiryEditor({ initial }: Props) {
  return (
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
      {initial.adminNotes ? (
        <div>
          <dt className="font-medium text-foreground">{ar.adminAdvertiseFieldNotes}</dt>
          <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">
            {initial.adminNotes}
          </dd>
        </div>
      ) : null}
      <div>
        <dt className="font-medium text-foreground">{ar.adminAdvertiseFieldCreated}</dt>
        <dd className="mt-1 text-muted-foreground">
          <time dateTime={initial.createdAtIso.slice(0, 10)}>
            {formatArticleDate(initial.createdAtIso.slice(0, 10))}
          </time>
        </dd>
      </div>
    </dl>
  )
}
