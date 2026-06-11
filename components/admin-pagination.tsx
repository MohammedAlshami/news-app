"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
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
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const hrefBase = basePath ?? ""

  const pages = useMemo(() => visiblePages(page, pageCount), [page, pageCount])
  if (pageCount <= 1) return null

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
