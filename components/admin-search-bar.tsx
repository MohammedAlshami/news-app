"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Suspense, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ar } from "@/lib/ui-ar"

function AdminSearchBarInner({ placeholder }: { placeholder?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("q") ?? "")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    const v = value.trim()
    if (v) {
      params.set("q", v)
    } else {
      params.delete("q")
    }
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? ar.adminSearchPlaceholder}
        className="h-8 w-48 md:w-56"
      />
      <Button type="submit" size="sm" variant="outline" className="h-8">
        <Search className="size-4" />
      </Button>
    </form>
  )
}

export function AdminSearchBar(props: { placeholder?: string }) {
  return (
    <Suspense fallback={null}>
      <AdminSearchBarInner {...props} />
    </Suspense>
  )
}
