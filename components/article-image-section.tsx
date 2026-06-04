"use client"

import { useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"

import { ArticleImageGallery } from "@/components/article-image-gallery"
import { formatArticleDate } from "@/lib/format-date"

type Props = {
  coverImageUrl: string | null
  bodyImages: { src: string; alt: string }[]
  categoryByline: string
  date: string
  title: string
  excerpt: string
  children: React.ReactNode
}

export function ArticleImageSection({ coverImageUrl, bodyImages, categoryByline, date, title, excerpt, children }: Props) {
  const allImages = coverImageUrl
    ? [{ src: coverImageUrl, alt: "" }, ...bodyImages]
    : bodyImages

  const [activeIndex, setActiveIndex] = useState(0)

  if (allImages.length === 0) return <>{children}</>

  const activeImage = allImages[activeIndex]

  return (
    <>
      <div className="pt-6">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">
          {categoryByline} ·{" "}
          <time dateTime={date} className="text-muted-foreground">
            {formatArticleDate(date)}
          </time>
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-pretty text-lg text-foreground">
          {excerpt}
        </p>
      </div>
      <div className="w-full pt-6">
        <div className="relative aspect-[21/14] w-full overflow-hidden rounded-xl border border-border bg-muted sm:aspect-[21/12]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeImage.src}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={activeImage.src}
                alt={activeImage.alt}
                fill
                className="object-cover"
                sizes="(max-width: 48rem) 100vw, 48rem"
                unoptimized
                priority={activeIndex === 0}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {allImages.length > 1 && (
        <ArticleImageGallery
          images={allImages}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
        />
      )}
      {children}
    </>
  )
}
