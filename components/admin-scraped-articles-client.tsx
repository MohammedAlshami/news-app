"use client"

import { useState } from "react"

import { AdminScrapeModal } from "@/components/admin-scrape-modal"
import { Button } from "@/components/ui/button"

// Combined categories from both RT and Independent sources
const SCRAPE_CATEGORIES = [
  { key: "news", label: "أخبار" },
  { key: "world", label: "عالم" },
  { key: "middle_east", label: "الشرق الأوسط" },
  { key: "politics", label: "سياسة" },
  { key: "business", label: "اقتصاد" },
  { key: "economy", label: "اقتصاد (Independent)" },
  { key: "sport", label: "رياضة" },
  { key: "culture", label: "ثقافة" },
  { key: "health", label: "صحة" },
  { key: "science", label: "علوم" },
  { key: "russia", label: "روسيا" },
  { key: "arts", label: "فنون" },
  { key: "environment", label: "بيئة" },
  { key: "varieties", label: "منوعات" },
]

export function AdminScrapedArticlesClient() {
  const [scrapeOpen, setScrapeOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setScrapeOpen(true)}>استخراج مقالات</Button>

      <AdminScrapeModal
        open={scrapeOpen}
        onOpenChange={setScrapeOpen}
        categories={SCRAPE_CATEGORIES}
      />
    </>
  )
}
