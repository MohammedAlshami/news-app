"use client"

import { useState } from "react"

import { AdminScrapeModal } from "@/components/admin-scrape-modal"
import { Button } from "@/components/ui/button"

// Combined categories from all news sources
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
  { key: "technology", label: "تكنولوجيا" },
  { key: "arab", label: "عرب" },
  { key: "palestine", label: "فلسطين" },
  { key: "arab-and-world", label: "عربي ودولي" },
  { key: "accidents", label: "حوادث" },
  { key: "egypt", label: "مصر" },
  { key: "news-syria", label: "سورية" },
  { key: "news-palestine", label: "فلسطين (عربي جديد)" },
  { key: "news-egypt", label: "مصر (عربي جديد)" },
  { key: "opinions", label: "أقلام وأراء" },
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
