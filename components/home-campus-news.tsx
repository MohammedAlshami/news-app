import Image from "next/image"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Amiri } from "next/font/google"

import { ALL_CATEGORIES_ID, getCategoryPagePath } from "@/lib/site-routes"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

const UNSPLASH = [
  "https://images.unsplash.com/photo-1579541814924-49fef17c5be5?q=80&w=670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1548811579-017cf2a4268b?q=80&w=689&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1545989253-02cc26577f88?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1579541591970-e5780dc6b31f?q=80&w=1343&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
] as const

const headingSerif = Amiri({
  subsets: ["arabic"],
  weight: ["700"],
  display: "swap",
})

function TagPill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
      {label}
    </span>
  )
}

export function HomeCampusNewsSection() {
  const allNewsHref = getCategoryPagePath(ALL_CATEGORIES_ID)

  const featuredTags = [
    ar.homeCampusHardFeaturedTag1,
    ar.homeCampusHardFeaturedTag2,
    ar.homeCampusHardFeaturedTag3,
  ]

  const side = [
    {
      src: UNSPLASH[1],
      title: ar.homeCampusHardSide1Title,
      excerpt: ar.homeCampusHardSide1Excerpt,
      tags: [ar.homeCampusHardSide1Tag1, ar.homeCampusHardSide1Tag2],
      key: "side-1",
    },
    {
      src: UNSPLASH[2],
      title: ar.homeCampusHardSide2Title,
      excerpt: ar.homeCampusHardSide2Excerpt,
      tags: [ar.homeCampusHardSide2Tag1, ar.homeCampusHardSide2Tag2],
      key: "side-2",
    },
    {
      src: UNSPLASH[3],
      title: ar.homeCampusHardSide3Title,
      excerpt: ar.homeCampusHardSide3Excerpt,
      tags: [ar.homeCampusHardSide3Tag1, ar.homeCampusHardSide3Tag2],
      key: "side-3",
    },
  ]

  return (
    <section dir="rtl" lang="ar" className="bg-white py-12 md:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8 xl:px-8 2xl:px-10">
        <header className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between lg:mb-12">
          <h2
            className={cn(
              headingSerif.className,
              "text-pretty text-right text-3xl leading-tight text-neutral-900 md:text-4xl lg:text-[2.5rem]",
            )}
          >
            {ar.homeCampusNewsTitle}
          </h2>
          <Link
            href={allNewsHref}
            className="inline-flex shrink-0 items-center gap-2 self-end text-sm font-medium text-neutral-700 transition-colors hover:text-black sm:self-auto"
          >
            <span>{ar.homeCampusNewsSeeAll}</span>
            <ChevronLeft className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-10 xl:gap-12">
          <article className="flex flex-col lg:col-span-3">
            <Link href="#" className="group block">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-200">
                <Image
                  src={UNSPLASH[0]}
                  alt=""
                  fill
                  priority
                  className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
              </div>
              <h3 className="mt-5 text-pretty text-right text-xl font-bold leading-snug text-neutral-900 transition group-hover:text-neutral-700 md:text-2xl">
                {ar.homeCampusHardFeaturedTitle}
              </h3>
            </Link>
            <div className="mt-4 flex flex-wrap justify-start gap-2">
              {featuredTags.map((label, i) => (
                <TagPill key={`feat-${i}`} label={label} />
              ))}
            </div>
          </article>

          <div className="flex flex-col gap-8 lg:col-span-2 lg:gap-7">
            {side.map((item) => (
              <article
                key={item.key}
                className="group border-b border-neutral-200 pb-8 last:border-0 last:pb-0 lg:pb-7"
              >
                <Link href="#" className="flex gap-4 sm:gap-5">
                  <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-200 sm:h-28 sm:w-32">
                    <Image
                      src={item.src}
                      alt=""
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 112px, 128px"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <h4 className="text-pretty text-base font-bold leading-snug text-neutral-900 transition group-hover:text-neutral-700 sm:text-lg">
                      {item.title}
                    </h4>
                    <p className="mt-2 line-clamp-3 text-pretty text-sm leading-relaxed text-neutral-600">
                      {item.excerpt}
                    </p>
                    <div className="mt-3 flex flex-wrap justify-start gap-2">
                      {item.tags.map((label, i) => (
                        <TagPill key={`${item.key}-t-${i}`} label={label} />
                      ))}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
