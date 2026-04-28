import Link from "next/link"

import { CategoryNav } from "@/components/category-nav"
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

function SectionVariant({
  section,
  index,
  categories,
}: {
  section: HomeSection
  index: number
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
    const lead = section.articles[0]
    const rest = section.articles.slice(1, 4)
    return (
      <section key={section.id} className="mb-16" id={section.id}>
        <SectionHeader title={section.title} accentClassName={accentClassName} href={section.href} />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-6 md:col-span-1">
            {rest.length > 0 ? (
              rest.map((article, itemIndex) => (
                <div
                  key={article.id}
                  className={cn(
                    "group cursor-pointer",
                    itemIndex !== rest.length - 1 && "border-b pb-6",
                  )}
                >
                  <h4 className={cn("mb-2 text-xs font-bold", itemIndex === 0 ? "text-red-600" : "text-gray-400")}>
                    {itemIndex === 0 ? "عاجل" : `منذ ${itemIndex === 1 ? "ساعة" : "٣ ساعات"}`}
                  </h4>
                  <h3 className="text-xl font-bold leading-tight transition group-hover:underline">
                    {article.title}
                  </h3>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
                لا توجد مقالات في هذا القسم بعد.
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            {lead ? (
              <Link href={`/news/${lead.id}`} className="group relative block min-h-[400px] overflow-hidden rounded-2xl">
                <img
                  src={getImage(lead)}
                  alt={lead.title}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 p-10 flex flex-col justify-end text-white">
                  <span className="mb-3 inline-block rounded bg-red-600 px-3 py-1 text-sm font-bold">
                    {getCategoryLabel(lead, categories)}
                  </span>
                  <h3 className="mb-2 text-3xl font-bold">{lead.title}</h3>
                  <p className="text-gray-200">{lead.excerpt}</p>
                </div>
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
                لا توجد مقالات في هذا القسم بعد.
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (index % 4 === 2) {
    return (
      <section key={section.id} className="mb-16" id={section.id}>
        <SectionHeader title={section.title} accentClassName={accentClassName} href={section.href} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {section.articles.length > 0 ? (
            section.articles.slice(0, 3).map((article) => (
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
                  <span className="mb-4 inline-block rounded bg-green-600 px-3 py-1 text-sm font-bold">
                    {getCategoryLabel(section.articles[0], categories)}
                  </span>
                  <h3 className="text-3xl font-bold">{section.articles[0].title}</h3>
                  <p className="mt-2 text-gray-200">{section.articles[0].excerpt}</p>
                </div>
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
                لا توجد مقالات في هذا القسم بعد.
              </div>
            )}
          </div>
          <div className="space-y-6">
            {section.articles.slice(1, 4).map((article) => (
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
      <div className="mx-auto max-w-[1400px] px-4 py-4">
        <AdPlaceholder text="مساحة إعلانية (728 × 90)" className="h-24" />
      </div>

      <section className="mx-auto max-w-[1400px] px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Link href={hero ? `/news/${hero.id}` : "#"} className="group relative overflow-hidden rounded-2xl lg:col-span-2">
            <img
              src={hero ? getImage(hero) : fallbackImage}
              alt={mainHero.title}
              className="h-[500px] w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 p-8 text-white">
              <span className="mb-4 inline-block rounded bg-red-600 px-3 py-1 text-sm font-bold">
                {hero ? getCategoryLabel(hero, categories) : ar.homeKicker}
              </span>
              <h1 className="mb-4 text-3xl font-bold leading-tight md:text-5xl">
                {mainHero.title}
              </h1>
              <p className="max-w-2xl text-gray-200">
                {mainHero.excerpt}
              </p>
            </div>
          </Link>

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
          <SectionVariant key={section.id} section={section} index={index} categories={categories} />
        ))}

        <div className="py-8">
          <AdPlaceholder text="إعلان ممول" className="h-32" />
        </div>

        {ads.length > 0 ? (
          <section className="py-6">
            <SiteAdSpots ads={ads} />
          </section>
        ) : null}

        <section className="mb-16">
          <SectionHeader title="جميع الأقسام" accentClassName="bg-gray-900" />
          <CategoryNav active={null} />
        </section>
      </main>
    </div>
  )
}
