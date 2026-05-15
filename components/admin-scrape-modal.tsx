"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: { key: string; label: string }[]
}

export function AdminScrapeModal({ open, onOpenChange, categories }: Props) {
  const [mode, setMode] = useState<"all" | "single">("all")
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0]?.key ?? ""
  )
  const [limit, setLimit] = useState<string>("10")
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleScrape = async () => {
    setPending(true)
    setError(null)
    setResult(null)

    const params = new URLSearchParams()
    const limitNum = Math.max(1, parseInt(limit, 10) || 10)
    params.set("limit", String(limitNum))

    if (mode === "single" && selectedCategory) {
      params.set("category", selectedCategory)
    }

    try {
      const res = await fetch(`/api/cron/scrape-news?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Scraping failed")
      }

      const topics = data.topics
        ? ` | Topics: ${data.topics.topicsCreated} created, ${data.topics.topicsReused} reused`
        : ""

      setResult(
        `Scraped successfully! Articles processed: ${data.topics?.articlesProcessed ?? "N/A"}${topics}`
      )

      // Refresh the page after successful scrape
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) {
          setError(null)
          setResult(null)
        }
      }}
    >
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>استخراج المقالات</DialogTitle>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {result ? (
          <p className="text-sm text-green-600" role="status">
            {result}
          </p>
        ) : null}

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>نطاق الاستخراج</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scrapeMode"
                  value="all"
                  checked={mode === "all"}
                  onChange={() => setMode("all")}
                />
                <span>كل الفئات</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scrapeMode"
                  value="single"
                  checked={mode === "single"}
                  onChange={() => setMode("single")}
                />
                <span>فئة واحدة</span>
              </label>
            </div>
          </div>

          {mode === "single" && (
            <div className="space-y-2">
              <Label htmlFor="scrape-category">اختر الفئة</Label>
              <select
                id="scrape-category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="scrape-limit">عدد المقالات</Label>
            <Input
              id="scrape-limit"
              type="number"
              min={1}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              الحد الأقصى لعدد المقالات المستخرجة
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" disabled={pending} onClick={handleScrape}>
            {pending ? "جاري الاستخراج..." : "استخراج"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
