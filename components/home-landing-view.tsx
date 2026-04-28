import Link from "next/link"

import { CategoryNav } from "@/components/category-nav"
import { SiteAdSpots } from "@/components/site-ad-spots"
import { Button } from "@/components/ui/button"
import type { SiteAdPublic } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"

type Props = {
  ads: SiteAdPublic[]
}

export async function HomeLandingView({ ads }: Props) {
  return (
    <div className="min-h-svh">
      <header className="border-b bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-20 sm:text-center">
          <p className="text-sm font-medium tracking-wide text-muted-foreground">
            {ar.homeKicker}
          </p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {ar.homeTitle}
          </h1>
          <p className="mt-3 text-pretty text-muted-foreground sm:mx-auto sm:max-w-lg">
            {ar.homeSub}
          </p>
          <div className="mt-6">
            <CategoryNav active={null} />
          </div>
          <div className="mt-8 flex flex-col items-center gap-2 sm:mx-auto">
            <Button asChild size="default" className="w-full sm:w-auto">
              <Link href="/category/all">{ar.homeViewAll}</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground sm:max-w-sm">
              {ar.homeNote}{" "}
              <span className="font-medium text-foreground/90">«{ar.homeNoteAll}»</span>{" "}
              {ar.homeNoteRest}
            </p>
          </div>
        </div>
      </header>

      {ads.length > 0 ? (
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
          <SiteAdSpots ads={ads} />
        </div>
      ) : null}
    </div>
  )
}
