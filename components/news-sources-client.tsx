"use client"

import { ExternalLink, Globe, Tag } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

type SourceCategory = { key: string; labelAr: string; url: string }

type NewsSource = {
  key: string
  name: string
  nameAr: string
  description: string
  url: string
  logoUrl: string
  logoFallbackBg: string
  logoFallbackText: string
  country: string
  language: string
  categories: SourceCategory[]
}

const SOURCES: NewsSource[] = [
  {
    key: "rt",
    name: "RT Arabic",
    nameAr: "RT عربي",
    description:
      "قناة RT عربي (روسيا اليوم سابقاً) قناة إخبارية روسية تبث باللغة العربية على مدار الساعة، وتغطي الأخبار العالمية والإقليمية والمحلية من منظور مستقل.",
    url: "https://arabic.rt.com",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Russia-today-logo.svg",
    logoFallbackBg: "#c8102e",
    logoFallbackText: "RT",
    country: "روسيا",
    language: "العربية",
    categories: [
      { key: "news", labelAr: "أخبار", url: "https://arabic.rt.com/news/" },
      { key: "world", labelAr: "العالم", url: "https://arabic.rt.com/world/" },
      { key: "middle_east", labelAr: "الشرق الأوسط", url: "https://arabic.rt.com/middle_east/" },
      { key: "russia", labelAr: "روسيا", url: "https://arabic.rt.com/russia/" },
      { key: "business", labelAr: "الأعمال", url: "https://arabic.rt.com/business/" },
      { key: "sport", labelAr: "رياضة", url: "https://arabic.rt.com/sport/" },
      { key: "press", labelAr: "صحافة", url: "https://arabic.rt.com/press/" },
      { key: "features", labelAr: "تقارير", url: "https://arabic.rt.com/features/" },
      { key: "guide", labelAr: "دليل", url: "https://arabic.rt.com/guide/" },
      { key: "docfilms", labelAr: "أفلام وثائقية", url: "https://arabic.rt.com/docfilms/" },
      { key: "prg", labelAr: "برامج", url: "https://arabic.rt.com/prg/" },
      { key: "satelites", labelAr: "فضاء", url: "https://arabic.rt.com/satelites/" },
    ],
  },
  {
    key: "independent",
    name: "Independent Arabia",
    nameAr: "إندبندنت عربية",
    description:
      "إندبندنت عربية النسخة العربية من صحيفة The Independent البريطانية العريقة، تقدم تحليلات معمّقة وتقارير متنوعة تشمل السياسة والاقتصاد والثقافة والعلوم والرياضة.",
    url: "https://www.independentarabia.com",
    logoUrl: "https://www.arabnews.com/sites/default/files/styles/n_670_395/public/main-image/2019/01/24/1440086-2029066319.png?itok=vorhEkyF",
    logoFallbackBg: "#e8003d",
    logoFallbackText: "IA",
    country: "المملكة المتحدة",
    language: "العربية",
    categories: [
      { key: "news", labelAr: "أخبار", url: "https://www.independentarabia.com/الأخبار" },
      { key: "world", labelAr: "العالم العربي", url: "https://www.independentarabia.com/الأخبار/العالم-العربي" },
      { key: "middle_east", labelAr: "الشرق الأوسط", url: "https://www.independentarabia.com/الأخبار/الشرق-الأوسط" },
      { key: "politics", labelAr: "سياسة", url: "https://www.independentarabia.com/سياسة" },
      { key: "economy", labelAr: "اقتصاد", url: "https://www.independentarabia.com/اقتصاد" },
      { key: "culture", labelAr: "ثقافة", url: "https://www.independentarabia.com/ثقافة" },
      { key: "arts", labelAr: "فنون", url: "https://www.independentarabia.com/فنون" },
      { key: "science", labelAr: "علوم", url: "https://www.independentarabia.com/علوم" },
      { key: "health", labelAr: "صحة", url: "https://www.independentarabia.com/صحة" },
      { key: "sport", labelAr: "رياضة", url: "https://www.independentarabia.com/رياضة" },
      { key: "environment", labelAr: "بيئة", url: "https://www.independentarabia.com/بيئة" },
      { key: "varieties", labelAr: "منوعات", url: "https://www.independentarabia.com/منوعات" },
    ],
  },
]

function LogoImage({ source }: { source: NewsSource }) {
  const [imgError, setImgError] = useState(false)
  if (imgError) {
    return (
      <div
        className="flex h-full w-full items-center justify-center rounded-xl text-xl font-black text-white"
        style={{ backgroundColor: source.logoFallbackBg }}
      >
        {source.logoFallbackText}
      </div>
    )
  }
  return (
    <Image
      src={source.logoUrl}
      alt={`${source.name} logo`}
      fill
      className="object-contain p-3"
      unoptimized
      onError={() => setImgError(true)}
    />
  )
}

type Props = {
  initialEnabledMap: Record<string, boolean>
}

export function NewsSourcesClient({ initialEnabledMap }: Props) {
  const [selected, setSelected] = useState<NewsSource | null>(null)
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(initialEnabledMap)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  async function handleToggle(key: string, next: boolean) {
    // Optimistic update
    setEnabledMap((prev) => ({ ...prev, [key]: next }))
    setBusyKey(key)
    try {
      const res = await fetch(`/api/admin/news-sources/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: next }),
      })
      if (!res.ok) throw new Error("Failed")
    } catch {
      // Revert on failure
      setEnabledMap((prev) => ({ ...prev, [key]: !next }))
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {SOURCES.map((source) => {
          const isEnabled = enabledMap[source.key] ?? true
          return (
            <div
              key={source.key}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all"
            >
              {/* Top row: logo + toggle */}
              <div className="flex items-start justify-between gap-3">
                <div className="relative h-16 w-32 overflow-hidden rounded-xl border border-border bg-muted">
                  <LogoImage source={source} />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Switch
                    checked={isEnabled}
                    disabled={busyKey === source.key}
                    onCheckedChange={(next) => handleToggle(source.key, next)}
                    aria-label={`تفعيل ${source.nameAr}`}
                  />
                  <span className={`text-xs font-medium ${isEnabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                    {isEnabled ? "مفعّل" : "معطّل"}
                  </span>
                </div>
              </div>

              {/* Name */}
              <div>
                <h2 className="text-lg font-bold leading-tight">{source.nameAr}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{source.name}</p>
              </div>

              {/* Description */}
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {source.description}
              </p>

              {/* Meta + details button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Tag className="size-3.5" />
                  <span>{source.categories.length} تصنيف</span>
                  <span className="mx-1 text-border">·</span>
                  <Globe className="size-3.5" />
                  <span>{source.country}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelected(source)}
                >
                  التفاصيل
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        {selected && (
          <DialogContent
            className="flex max-h-[92vh] max-w-[calc(100%-2rem)] min-w-0 flex-col gap-0 overflow-hidden p-0 pt-12 sm:max-w-2xl"
            dir="rtl"
            showCloseButton
          >
            <DialogTitle className="sr-only">{selected.nameAr}</DialogTitle>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
              {/* Header */}
              <div className="flex items-start gap-5">
                <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                  <LogoImage source={selected} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-black leading-tight">{selected.nameAr}</h2>
                  <p className="text-sm text-muted-foreground">{selected.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-muted-foreground">
                      <Globe className="size-3" />
                      {selected.country}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium ${
                      (enabledMap[selected.key] ?? true)
                        ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                        : "border-border bg-muted text-muted-foreground"
                    }`}>
                      {(enabledMap[selected.key] ?? true) ? "مفعّل" : "معطّل"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="mt-5 text-[15px] leading-7 text-muted-foreground">
                {selected.description}
              </p>

              {/* Website link */}
              <div className="mt-5">
                <Button variant="outline" size="sm" asChild>
                  <a href={selected.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="me-2 size-4" />
                    زيارة الموقع
                  </a>
                </Button>
              </div>

              {/* Categories */}
              <div className="mt-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Tag className="size-4" />
                  التصنيفات المدعومة ({selected.categories.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selected.categories.map((cat) => (
                    <a
                      key={cat.key}
                      href={cat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {cat.labelAr}
                      <ExternalLink className="size-2.5 opacity-50" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
