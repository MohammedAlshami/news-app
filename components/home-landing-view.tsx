import Link from "next/link"

import { SiteAdSpots } from "@/components/site-ad-spots"
import { AdPlaceholder, SectionHeader, StoryCard, StoryListItem } from "@/components/news-landing"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"
import type { Article, SiteAdPublic, SiteCategory } from "@/lib/site-types"

type HomeSection = {
  id: string
  title: string
  href: string
  articles: Article[]
}

type Props = {
  ads: SiteAdPublic[]
  showAds: boolean
  hero: Article | null
  sideStories: Article[]
  latestArticles: Article[]
  sections: HomeSection[]
  categories: SiteCategory[]
}

const fallbackImage =
  "https://pub-22db16bb70fb414aafa322450d8bf3c1.r2.dev/landing/0f8e1a7b62c7f5cc2a650b40d8cd2168.jpg"

function getImage(article: Article) {
  return (article as Article & { coverImageUrl?: string | null }).coverImageUrl ?? fallbackImage
}

function getCategoryLabel(article: Article, categories: SiteCategory[]) {
  const categoryId = article.categoryIds[0]
  if (!categoryId) return ar.uncategorized
  return categories.find((c) => c.id === categoryId)?.name ?? ar.uncategorized
}

function formatGregorianDate(date: string) {
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return date
  return new Intl.DateTimeFormat("ar", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value)
}

function getFeaturedSideArticles(section: HomeSection, allSections: HomeSection[]) {
  const seen = new Set<string>()
  const collected: Article[] = []

  for (const article of section.articles) {
    if (collected.length >= 5) break
    if (seen.has(article.id)) continue
    seen.add(article.id)
    collected.push(article)
  }

  if (collected.length < 5) {
    for (const fallbackSection of allSections) {
      if (fallbackSection.id === section.id) continue
      for (const article of fallbackSection.articles) {
        if (collected.length >= 5) break
        if (seen.has(article.id)) continue
        seen.add(article.id)
        collected.push(article)
      }
      if (collected.length >= 5) break
    }
  }

  return collected.slice(1, 5)
}

function SectionVariant({
  section,
  allSections,
  index,
  categories,
}: {
  section: HomeSection
  index: number
  allSections: HomeSection[]
  categories: SiteCategory[]
}) {
  const accentClassName =
    index % 4 === 0
      ? "bg-black"
      : index % 4 === 1
        ? "bg-red-600"
        : index % 4 === 2
          ? "bg-green-600"
          : "bg-gray-900"

  if (index % 4 === 1) {
    return null
  }

  if (index % 4 === 2) {
    return (
      <section key={section.id} className="mb-16" id={section.id}>
        <SectionHeader title={section.title} accentClassName={accentClassName} href={section.href} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {section.articles.length > 0 ? (
            section.articles.slice(0, 4).map((article) => (
              <StoryCard
                key={article.id}
                title={article.title}
                excerpt={article.excerpt}
                image={getImage(article)}
                category={section.title}
                href={`/news/${article.id}`}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
              لا توجد مقالات في هذا القسم بعد.
            </div>
          )}
        </div>
      </section>
    )
  }

  if (index % 4 === 3) {
    return (
      <section key={section.id} className="mb-16" id={section.id}>
        <SectionHeader title={section.title} accentClassName={accentClassName} href={section.href} />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {section.articles[0] ? (
              <Link href={`/news/${section.articles[0].id}`} className="group relative block overflow-hidden rounded-2xl">
                <img
                  src={getImage(section.articles[0])}
                  alt={section.articles[0].title}
                  className="h-[360px] w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 p-8 text-white">
                  <span className="mb-4 w-fit self-start rounded bg-green-600 px-3 py-1 text-sm font-bold">
                    {getCategoryLabel(section.articles[0], categories)}
                  </span>
                  <h3 className="line-clamp-2 text-2xl font-bold lg:text-3xl">
                    {section.articles[0].title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-gray-200">
                    {section.articles[0].excerpt}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
                لا توجد مقالات في هذا القسم بعد.
              </div>
            )}
          </div>
          <div className="space-y-6">
            {section.articles.slice(1, 5).map((article) => (
              <StoryListItem
                key={article.id}
                title={article.title}
                category={section.title}
                image={getImage(article)}
                href={`/news/${article.id}`}
                time="منذ قليل"
              />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section key={section.id} className="mb-16" id={section.id}>
      <SectionHeader title={section.title} accentClassName={accentClassName} href={section.href} />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {section.articles.length > 0 ? (
          section.articles.slice(0, 4).map((article) => (
            <StoryCard
              key={article.id}
              title={article.title}
              excerpt={article.excerpt}
              image={getImage(article)}
              category={section.title}
              href={`/news/${article.id}`}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
            لا توجد مقالات في هذا القسم بعد.
          </div>
        )}
      </div>
    </section>
  )
}

export async function HomeLandingView({
  ads,
  showAds,
  hero,
  sideStories,
  latestArticles,
  sections,
  categories,
}: Props) {
  const mainHero = hero ?? {
    title: "لا توجد مقالات منشورة بعد",
    excerpt: "أضف مقالات وأقسام من لوحة التحكم لتظهر هنا بشكل تلقائي.",
    category: ar.homeKicker,
  }
  const primarySections = sections.slice(0, 4)

  return (
    <div className="min-h-svh bg-white text-[#1a1a1a]">

      <section className="mx-auto max-w-[1400px] px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl lg:col-span-2">
            <Link href={hero ? `/news/${hero.id}` : "#"} className="block">
              <img
                src={hero ? getImage(hero) : fallbackImage}
                alt={mainHero.title}
                className="h-[500px] w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </Link>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 right-0 max-w-[86%] bg-white p-6 shadow-2xl md:max-w-[62%] md:p-10">
              <div className="mb-5 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-red-600">
                <span className="inline-flex items-center gap-2">
                  {hero ? getCategoryLabel(hero, categories) : ar.homeKicker}
                </span>
                <span className="text-gray-300">|</span>
                <span>{hero ? formatGregorianDate(hero.date) : ""}</span>
              </div>
              <h1 className="mb-4 line-clamp-3 text-2xl font-extrabold leading-tight text-gray-900 md:text-4xl">
                {mainHero.title}
              </h1>
              <div className="h-1 w-16 bg-red-600" />
            </div>
          </div>

          <div className="space-y-6">
            {sideStories.length > 0 ? sideStories.map((story, index) => (
              <StoryListItem
                key={story.id}
                title={story.title}
                category={getCategoryLabel(story, categories)}
                image={getImage(story)}
                href={`/news/${story.id}`}
                time={`منذ ${index === 0 ? "ساعتين" : index === 1 ? "٤ ساعات" : "٦ ساعات"}`}
                compact={index === 0}
              />
            )) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
                أضف مقالات منشورة لتظهر هنا تلقائياً.
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1400px] px-4 py-12">
        <section className="mb-16">
          <SectionHeader title="الأحدث" accentClassName="bg-red-600" href="/category/all" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latestArticles.length > 0 ? (
              latestArticles.map((article) => (
                <StoryCard
                  key={article.id}
                  title={article.title}
                  excerpt={article.excerpt}
                  image={getImage(article)}
                  category={getCategoryLabel(article, categories)}
                  href={`/news/${article.id}`}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
                لا توجد مقالات منشورة بعد.
              </div>
            )}
          </div>
        </section>

        {primarySections.map((section, index) => (
          <SectionVariant
            key={section.id}
            section={section}
            index={index}
            allSections={primarySections}
            categories={categories}
          />
        ))}

        {showAds ? (
          <div className="py-8">
            {ads.length > 0 ? (
              <section className="py-6">
                <SiteAdSpots ads={ads} />
              </section>
            ) : (
              <AdPlaceholder text="إعلان ممول" className="h-32" />
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}
