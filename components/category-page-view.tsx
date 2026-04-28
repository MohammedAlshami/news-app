import Link from "next/link"
import { House } from "lucide-react"

import { ArticleFeed } from "@/components/article-feed"
import { CategoryNav } from "@/components/category-nav"
import { Button } from "@/components/ui/button"
import type { Article } from "@/lib/articles"
import { ar } from "@/lib/ui-ar"

type CategoryPageViewProps = {
  activeId: string
  heroTitle: string
  kicker: string
  description: string
  feedHeading: string
  feedSubheading: string
  articles: Article[]
  categoryNameById: Record<string, string>
}

export function CategoryPageView({
  activeId,
  heroTitle,
  kicker,
  description,
  feedHeading,
  feedSubheading,
  articles,
  categoryNameById,
}: CategoryPageViewProps) {
  return (
    <div className="min-h-svh">
      <header className="border-b bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10 sm:text-center">
          <div className="mb-4 flex w-full justify-start sm:justify-center">
            <Button asChild variant="outline" size="sm" className="shadow-xs">
              <Link href="/" className="gap-1.5">
                <House
                  className="size-3.5"
                  aria-hidden
                />
                {ar.home}
              </Link>
            </Button>
          </div>
          <p className="text-sm font-medium tracking-wide text-muted-foreground">
            {kicker}
          </p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {heroTitle}
          </h1>
          <p className="mt-3 text-pretty text-muted-foreground sm:mx-auto sm:max-w-lg">
            {description}
          </p>
          <div className="mt-6">
            <CategoryNav active={activeId} />
          </div>
        </div>
      </header>

      <ArticleFeed
        articles={articles}
        heading={feedHeading}
        subheading={feedSubheading}
        categoryNameById={categoryNameById}
      />
    </div>
  )
}
