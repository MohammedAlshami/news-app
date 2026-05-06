import Image from "next/image"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

const IMG_FEATURE =
  "https://images.unsplash.com/photo-1630142895963-6996ae6b3a5b?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
const IMG_SIDE =
  "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1052&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
const IMG_ROW =
  "https://images.unsplash.com/photo-1617191979724-f755c6d83e01?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"

type ArticleCardProps = {
  category: string
  title: string
  description: string
  authorLine: string
  dateLabel: string
  imageSrc: string
  sizes: string
  size?: "large" | "small"
}

function ArticleCard({
  category,
  title,
  description,
  authorLine,
  dateLabel,
  imageSrc,
  sizes,
  size = "small",
}: ArticleCardProps) {
  return (
    <article className="flex flex-col gap-4">
      <Link href="#" className="group block">
        <div className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-3xl bg-neutral-100">
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes={sizes}
            priority={size === "large"}
          />
        </div>
      </Link>
      <div className="space-y-2 px-1">
        <span className="block text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-800">
          {category}
        </span>
        <h2
          className={cn(
            "cursor-pointer font-extrabold leading-[1.1] text-gray-900 decoration-2 underline-offset-4 hover:underline",
            size === "large" ? "text-2xl md:text-4xl" : "text-xl",
          )}
        >
          <Link href="#">{title}</Link>
        </h2>
        <p
          className={cn(
            "text-[15px] leading-relaxed text-gray-600",
            size === "large" ? "line-clamp-4" : "line-clamp-3",
          )}
        >
          {description}
        </p>
        <div className="flex items-center gap-2 pt-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
            <ExternalLink className="h-3 w-3 text-gray-500" aria-hidden />
          </div>
          <span className="text-[13px] font-bold text-gray-700">
            {authorLine}{" "}
            <span className="mx-1 font-normal text-gray-300" aria-hidden>
              •
            </span>{" "}
            <span className="font-medium text-gray-400">{dateLabel}</span>
          </span>
        </div>
      </div>
    </article>
  )
}

export function HomeHeroSection() {
  return (
    <section dir="rtl" lang="ar" className="bg-white">
      <div className="mx-auto max-w-[90rem] px-6 py-8 md:px-12 md:py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <ArticleCard
              size="large"
              category={ar.homeHeroFeatureCategory}
              title={ar.homeHeroFeatureTitle}
              description={ar.homeHeroFeatureExcerpt}
              authorLine={`بقلم ${ar.homeHeroFeatureAuthor}`}
              dateLabel={ar.homeHeroFeatureDate}
              imageSrc={IMG_FEATURE}
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
          </div>

          <div className="flex flex-col gap-12 lg:col-span-5">
            <ArticleCard
              category={ar.homeHeroSideCategory}
              title={ar.homeHeroSideTitle}
              description={ar.homeHeroSideExcerpt}
              authorLine={`بقلم ${ar.homeHeroSideAuthor}`}
              dateLabel={ar.homeHeroSideDate}
              imageSrc={IMG_SIDE}
              sizes="(max-width: 1024px) 100vw, 40vw"
            />

            <div className="flex gap-4 border-t border-gray-100 pt-4 md:gap-6">
              <div className="relative w-1/3 shrink-0 overflow-hidden rounded-2xl bg-neutral-100 aspect-square">
                <Image
                  src={IMG_ROW}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 200px"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-widest text-indigo-800">
                  {ar.homeHeroRowCategory}
                </span>
                <h3 className="cursor-pointer text-lg font-extrabold leading-tight text-gray-900 hover:underline">
                  <Link href="#">{ar.homeHeroRowTitle}</Link>
                </h3>
                <p className="line-clamp-2 text-[14px] leading-relaxed text-gray-600">
                  {ar.homeHeroRowExcerpt}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <ExternalLink className="h-3 w-3 text-gray-500" aria-hidden />
                  </div>
                  <span className="text-[12px] font-bold leading-none text-gray-500">
                    بقلم {ar.homeHeroRowAuthor}{" "}
                    <span className="mx-1 font-normal text-gray-300" aria-hidden>
                      •
                    </span>{" "}
                    <span className="font-medium text-gray-400">{ar.homeHeroRowDate}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
