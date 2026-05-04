"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Props = {
  page: number
  pageSize: number
  total: number
  basePath?: string
  prevHref?: string
  nextHref?: string
  className?: string
}

function buildHref(basePath: string, page: number) {
  return `${basePath}?page=${page}`
}

function visiblePages(page: number, pageCount: number) {
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1])
  return [...pages]
    .filter((n) => n >= 1 && n <= pageCount)
    .sort((a, b) => a - b)
}

export function AdminPagination({
  page,
  pageSize,
  total,
  basePath,
  prevHref,
  nextHref,
  className,
}: Props) {
  const router = useRouter()
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const [draftPage, setDraftPage] = useState(String(page))
  const hrefBase = basePath ?? ""

  const pages = useMemo(() => visiblePages(page, pageCount), [page, pageCount])
  if (pageCount <= 1) return null

  function goToPage(rawValue: string) {
    const next = Number(rawValue)
    if (!Number.isInteger(next)) return
    const clamped = Math.min(pageCount, Math.max(1, next))
    if (!hrefBase) return
    router.push(buildHref(hrefBase, clamped))
  }

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-2">
        {(prevHref || hrefBase) ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={prevHref ?? buildHref(hrefBase, page - 1)}>
              <ChevronRight className="size-4" />
              السابق
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronRight className="size-4" />
            السابق
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {pages.map((n, index) => {
          const prev = pages[index - 1]
          const gap = prev !== undefined && n - prev > 1
          return (
            <div key={n} className="flex items-center gap-2">
              {gap ? <span className="px-1 text-muted-foreground">…</span> : null}
              {n === page ? (
                <Button variant="default" size="sm" disabled className="min-w-8">
                  {n}
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild className="min-w-8">
                  <Link href={buildHref(hrefBase, n)}>{n}</Link>
                </Button>
              )}
            </div>
          )
        })}
        <div className="flex items-center gap-2">
          <Input
            value={draftPage}
            onChange={(e) => setDraftPage(e.target.value)}
            onBlur={() => goToPage(draftPage)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                goToPage(draftPage)
              }
            }}
            key={page}
            inputMode="numeric"
            className="h-8 w-16 border-0 bg-transparent text-center shadow-none focus-visible:ring-0"
            aria-label="رقم الصفحة"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {page < pageCount && (nextHref || hrefBase) ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={nextHref ?? buildHref(hrefBase, page + 1)}>
              التالي
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            التالي
            <ChevronLeft className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
