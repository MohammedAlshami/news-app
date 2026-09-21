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
    key: "skynews",
    name: "Sky News Arabia",
    nameAr: "سكاي نيوز عربية",
    description:
      "سكاي نيوز عربية قناة فضائية إخبارية ناطقة باللغة العربية من العالم العربي وإليه، وهي استثمار مشترك بين شركة أبوظبي للاستثمار الإعلامي ومؤسسة سكاي البريطانية.",
    url: "https://www.skynewsarabia.com",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Sky_News_Arabia_logo.svg/1200px-Sky_News_Arabia_logo.svg.png",
    logoFallbackBg: "#ac0000",
    logoFallbackText: "SN",
    country: "الإمارات العربية المتحدة",
    language: "العربية",
    categories: [
      { key: "middle_east", labelAr: "شرق أوسط", url: "https://www.skynewsarabia.com/middle-east" },
      { key: "world", labelAr: "عالم", url: "https://www.skynewsarabia.com/world" },
      { key: "sport", labelAr: "رياضة", url: "https://www.skynewsarabia.com/sport" },
      { key: "business", labelAr: "اقتصاد", url: "https://www.skynewsarabia.com/business" },
      { key: "technology", labelAr: "علوم", url: "https://www.skynewsarabia.com/technology" },
      { key: "varieties", labelAr: "منوعات", url: "https://www.skynewsarabia.com/varieties" },
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
  {
    key: "youm7",
    name: "Youm7",
    nameAr: "اليوم السابع",
    description:
      "اليوم السابع صحيفة إخبارية مصرية تصدر عن مؤسسة اليوم السابع، وتغطي الأخبار المصرية والعربية والعالمية والسياسية والاقتصادية والرياضية والفنية.",
    url: "https://www.youm7.com",
    logoUrl: "https://img.youm7.com/images/graphics/logoyoum7.png",
    logoFallbackBg: "#c42126",
    logoFallbackText: "Y7",
    country: "مصر",
    language: "العربية",
    categories: [
      { key: "politics", labelAr: "سياسة", url: "https://www.youm7.com/Section/سياسة/319/1" },
      { key: "world", labelAr: "عالم", url: "https://www.youm7.com/Section/أخبار-عالمية/286/1" },
      { key: "arab", labelAr: "عرب", url: "https://www.youm7.com/Section/أخبار-عربية/88/1" },
      { key: "business", labelAr: "اقتصاد", url: "https://www.youm7.com/Section/اقتصاد-وبورصة/297/1" },
      { key: "sport", labelAr: "رياضة", url: "https://www.youm7.com/Section/أخبار-الرياضة/298/1" },
      { key: "art", labelAr: "فن", url: "https://www.youm7.com/Section/فن/48/1" },
      { key: "health", labelAr: "صحة", url: "https://www.youm7.com/Section/صحة-وطب/245/1" },
      { key: "tech", labelAr: "تكنولوجيا", url: "https://www.youm7.com/Section/علوم-و-تكنولوجيا/328/1" },
    ],
  },
  {
    key: "bbc",
    name: "BBC Arabic",
    nameAr: "بي بي سي عربي",
    description:
      "بي بي سي عربي خدمة إخبارية باللغة العربية من هيئة الإذاعة البريطانية (BBC)، تقدم أخباراً وتحليلات وتقارير من الشرق الأوسط وحول العالم.",
    url: "https://www.bbc.com/arabic",
    logoUrl: "https://www.bbc.com/favicon.ico",
    logoFallbackBg: "#bb1919",
    logoFallbackText: "BBC",
    country: "المملكة المتحدة",
    language: "العربية",
    categories: [
      { key: "world", labelAr: "عالم", url: "https://www.bbc.com/arabic/topics/cz9mm6r1q5et" },
      { key: "middle_east", labelAr: "الشرق الأوسط", url: "https://www.bbc.com/arabic/topics/c2dl0pn0lqjt" },
      { key: "sport", labelAr: "رياضة", url: "https://www.bbc.com/arabic/topics/cdxkdwgjw2zt" },
    ],
  },
  {
    key: "alquds",
    name: "Al Quds",
    nameAr: "جريدة القدس",
    description:
      "جريدة القدس صحيفة فلسطينية يومية تصدر في القدس، تغطي الأخبار الفلسطينية والعربية والدولية والاقتصاد والرياضة والمنوعات.",
    url: "https://www.alquds.com",
    logoUrl: "https://cdn.alquds.com/uploads/4736cd20e20d0f66e2edcc94a8e4d6e5.png",
    logoFallbackBg: "#1d232a",
    logoFallbackText: "QD",
    country: "فلسطين",
    language: "العربية",
    categories: [
      { key: "palestine", labelAr: "فلسطين", url: "https://www.alquds.com/ar/categories/palestine" },
      { key: "arab-and-world", labelAr: "عربي ودولي", url: "https://www.alquds.com/ar/categories/arab-and-world" },
      { key: "business", labelAr: "اقتصاد", url: "https://www.alquds.com/ar/categories/business" },
      { key: "sport", labelAr: "رياضة", url: "https://www.alquds.com/ar/categories/sport" },
      { key: "misc", labelAr: "منوعات", url: "https://www.alquds.com/ar/categories/misc" },
      { key: "opinions", labelAr: "أقلام وأراء", url: "https://www.alquds.com/ar/categories/opinions" },
    ],
  },
  {
    key: "elwatan",
    name: "El Watan News",
    nameAr: "الوطن",
    description:
      "الوطن بوابة إخبارية مصرية شاملة تقدم أحدث أخبار مصر والدول العربية والعالم وأخبار الرياضة والفن والاقتصاد والسياسة.",
    url: "https://www.elwatannews.com",
    logoUrl: "https://www.elwatannews.com/assets/images/logo_elwatannews.jpeg",
    logoFallbackBg: "#f37021",
    logoFallbackText: "WT",
    country: "مصر",
    language: "العربية",
    categories: [
      { key: "egypt", labelAr: "أخبار مصر", url: "https://www.elwatannews.com/section/115" },
      { key: "world", labelAr: "أخبار العالم", url: "https://www.elwatannews.com/section/39" },
      { key: "business", labelAr: "اقتصاد", url: "https://www.elwatannews.com/section/77" },
      { key: "art", labelAr: "فن", url: "https://www.elwatannews.com/section/60" },
      { key: "misc", labelAr: "منوعات", url: "https://www.elwatannews.com/section/52" },
      { key: "accidents", labelAr: "حوادث", url: "https://www.elwatannews.com/section/99" },
    ],
  },
  {
    key: "alaraby",
    name: "Al Araby Al Jadeed",
    nameAr: "العربي الجديد",
    description:
      "العربي الجديد صحيفة عربية دولية تصدر عن المركز العربي للصحافة، تغطي السياسة والاقتصاد والثقافة والرياضة والمنوعات والتحقيقات.",
    url: "https://www.aajeg.com",
    logoUrl: "https://www.aajeg.com/themes/custom/alaraby_revamp/logo.svg",
    logoFallbackBg: "#000000",
    logoFallbackText: "AJ",
    country: "المملكة المتحدة",
    language: "العربية",
    categories: [
      { key: "news-egypt", labelAr: "مصر", url: "https://www.aajeg.com/news/egypt" },
      { key: "news-syria", labelAr: "سورية", url: "https://www.aajeg.com/news/syria" },
      { key: "news-palestine", labelAr: "فلسطين", url: "https://www.aajeg.com/news/palestine" },
      { key: "news-world", labelAr: "دولي", url: "https://www.aajeg.com/news/world" },
      { key: "politics", labelAr: "سياسة", url: "https://www.aajeg.com/politics" },
      { key: "economy", labelAr: "اقتصاد", url: "https://www.aajeg.com/economy" },
      { key: "sport", labelAr: "رياضة", url: "https://www.aajeg.com/sport" },
      { key: "culture", labelAr: "ثقافة", url: "https://www.aajeg.com/culture" },
    ],
  },
  {
    key: "alhurra",
    name: "Alhurra",
    nameAr: "الحرة",
    description:
      "الحرة قناة إخبارية أمريكية ناطقة بالعربية تمولها الحكومة الأمريكية، وتغطي الأخبار السياسية والاقتصادية والاجتماعية في الشرق الأوسط والعالم.",
    url: "https://alhurra.com",
    logoUrl: "https://alhurra.com/wp-content/uploads/2023/12/cropped-alhurra-site-icon-192x192.png",
    logoFallbackBg: "#e62b34",
    logoFallbackText: "HR",
    country: "الولايات المتحدة",
    language: "العربية",
    categories: [
      { key: "america", labelAr: "أميركا", url: "https://alhurra.com/category/أميركا" },
      { key: "iran", labelAr: "إيران", url: "https://alhurra.com/category/إيران" },
      { key: "lebanon", labelAr: "لبنان", url: "https://alhurra.com/category/لبنان" },
      { key: "israel", labelAr: "إسرائيل", url: "https://alhurra.com/category/إسرائيل" },
      { key: "gulf", labelAr: "الخليج", url: "https://alhurra.com/category/الخليج" },
      { key: "iraq", labelAr: "العراق", url: "https://alhurra.com/category/العراق" },
      { key: "egypt", labelAr: "مصر", url: "https://alhurra.com/category/مصر" },
      { key: "syria", labelAr: "سوريا", url: "https://alhurra.com/category/سوريا" },
    ],
  },
  {
    key: "aawsat",
    name: "Asharq Al-Awsat",
    nameAr: "الشرق الأوسط",
    description:
      "الشرق الأوسط صحيفة عربية دولية تصدر من لندن، تأسست عام 1978، وتغطي الأخبار السياسية والاقتصادية والثقافية والرياضية في العالم العربي والعالم.",
    url: "https://aawsat.com",
    logoUrl: "https://aawsat.com/themes/custom/aawsatv3/favicon-new.png",
    logoFallbackBg: "#1a1a2e",
    logoFallbackText: "SA",
    country: "السعودية",
    language: "العربية",
    categories: [
      { key: "middle-east", labelAr: "الشرق الأوسط", url: "https://aawsat.com/%D8%A7%D9%84%D8%B4%D8%B1%D9%82-%D8%A7%D9%84%D8%A3%D9%88%D8%B3%D8%B7" },
      { key: "world", labelAr: "العالم", url: "https://aawsat.com/%D8%A7%D9%84%D8%B9%D8%A7%D9%84%D9%85" },
      { key: "economy", labelAr: "الاقتصاد", url: "https://aawsat.com/%D8%A7%D9%84%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF" },
      { key: "sport", labelAr: "الرياضة", url: "https://aawsat.com/%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D8%A9" },
      { key: "culture", labelAr: "ثقافة وفنون", url: "https://aawsat.com/%D8%AB%D9%82%D8%A7%D9%81%D8%A9-%D9%88%D9%81%D9%86%D9%88%D9%86" },
    ],
  },
  {
    key: "shabiba",
    name: "Shabiba",
    nameAr: "الشبيبة",
    description:
      "الشبيبة موقع إخباري عماني شامل يغطي آخر أخبار سلطنة عمان المحلية والعالمية، وأخبار الرياضة والاقتصاد والتكنولوجيا.",
    url: "https://shabiba.com",
    logoUrl: "https://shabiba.com/assets/img/favicon.png",
    logoFallbackBg: "#2F71C1",
    logoFallbackText: "SB",
    country: "عمان",
    language: "العربية",
    categories: [
      { key: "local", labelAr: "بلادنا", url: "https://shabiba.com/category/بلادنا" },
      { key: "event", labelAr: "الحدث", url: "https://shabiba.com/category/الحدث" },
      { key: "economy", labelAr: "اقتصاد", url: "https://shabiba.com/category/مؤشر" },
      { key: "sports", labelAr: "رياضة", url: "https://shabiba.com/category/الجماهير" },
      { key: "tech", labelAr: "تكنولوجيا", url: "https://shabiba.com/category/تكنولوجيا" },
      { key: "lifestyle", labelAr: "مزاج", url: "https://shabiba.com/category/مزاج" },
    ],
  },
  {
    key: "addustour",
    name: "Addustour",
    nameAr: "الدستور",
    description:
      "جريدة الدستور الأردنية صحيفة يومية سياسية اقتصادية ثقافية اجتماعية شاملة، تصدر في عمان وتغطي الأخبار المحلية والعربية والدولية.",
    url: "https://addustour.com",
    logoUrl: "https://addustour.com/favicon.ico",
    logoFallbackBg: "#083b74",
    logoFallbackText: "DT",
    country: "الأردن",
    language: "العربية",
    categories: [
      { key: "local", labelAr: "محليات", url: "https://addustour.com/categories/1-محليات" },
      { key: "arab-world", labelAr: "عربي ودولي", url: "https://addustour.com/categories/5-عربي-دولي" },
      { key: "economy", labelAr: "اقتصاد", url: "https://addustour.com/categories/4-اقتصاد" },
      { key: "sports", labelAr: "رياضة", url: "https://addustour.com/categories/7-رياضة" },
      { key: "culture", labelAr: "ثقافة", url: "https://addustour.com/categories/3-ثقافة" },
      { key: "opinions", labelAr: "قضايا وأراء", url: "https://addustour.com/categories/8-قضايا-واراء" },
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
