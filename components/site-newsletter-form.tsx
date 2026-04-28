"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ar } from "@/lib/ui-ar"

export function SiteNewsletterForm() {
  const [hint, setHint] = useState<string | null>(null)

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        setHint(ar.footerNewsletterSoon)
      }}
    >
      <input
        type="email"
        name="email"
        placeholder={ar.footerNewsletterPlaceholder}
        className="rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors focus:border-black focus:outline-none"
        autoComplete="email"
      />
      <Button type="submit" className="rounded-lg bg-black font-bold text-white hover:bg-gray-800">
        {ar.footerNewsletterSubmit}
      </Button>
      {hint ? (
        <p className="text-xs text-gray-500" role="status">
          {hint}
        </p>
      ) : null}
    </form>
  )
}
