"use client"

import { useActionState } from "react"

import { submitAdvertiseInquiryAction } from "@/app/(site)/advertise/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

type FormState = { ok: true } | { ok: false; error: string } | null

function AdvertiseWithUsFormFields() {
  const [state, formAction, pending] = useActionState(
    submitAdvertiseInquiryAction,
    null as FormState,
  )

  if (state?.ok) {
    return (
      <div
        className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-4 py-6 text-center"
        role="status"
      >
        <p className="text-sm font-medium text-foreground">{ar.advertiseSuccess}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.ok === false ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="advertise-name">{ar.advertiseFieldName}</Label>
        <Input
          id="advertise-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="text-start"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="advertise-email">{ar.advertiseFieldEmail}</Label>
        <Input
          id="advertise-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="text-start"
          dir="ltr"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="advertise-phone">{ar.advertiseFieldPhone}</Label>
        <Input
          id="advertise-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="text-start"
          dir="ltr"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="advertise-company">{ar.advertiseFieldCompany}</Label>
        <Input
          id="advertise-company"
          name="company"
          type="text"
          className="text-start"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="advertise-message">{ar.advertiseFieldMessage}</Label>
        <Textarea
          id="advertise-message"
          name="message"
          required
          rows={6}
          className="min-h-32 resize-y text-start"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? ar.advertiseSubmitting : ar.advertiseSubmit}
      </Button>
    </form>
  )
}

export function AdvertiseWithUsForm({ className }: { className?: string }) {
  return (
    <div className={cn("w-full max-w-lg", className)}>
      <AdvertiseWithUsFormFields />
    </div>
  )
}
