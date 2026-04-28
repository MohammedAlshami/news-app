"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useRef, useState, useTransition } from "react"

import {
  deleteSiteAdAction,
  removeSiteAdBannerAction,
  updateSiteAdAction,
  uploadSiteAdBannerAction,
} from "@/app/admin/ads/actions"
import type { SiteAd } from "@/db/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  type SiteAdTierId,
  normalizeSiteAdTier,
} from "@/lib/site-ad-tier"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"
import { ImageIcon, Trash2, Upload } from "lucide-react"

type Props = {
  initial: SiteAd
}

const TIER_ORDER: SiteAdTierId[] = [
  "standard",
  "gold",
  "premium",
  "platinum",
]

function tierShortLabel(id: SiteAdTierId): string {
  switch (id) {
    case "standard":
      return ar.adminSiteAdTierStandard
    case "gold":
      return ar.adminSiteAdTierGold
    case "premium":
      return ar.adminSiteAdTierPremium
    case "platinum":
      return ar.adminSiteAdTierPlatinum
    default:
      return ar.adminSiteAdTierStandard
  }
}

const tierSurface: Record<
  SiteAdTierId,
  { on: string; off: string }
> = {
  standard: {
    on: "border-border bg-muted text-foreground shadow-inner ring-2 ring-foreground/15",
    off: "border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40",
  },
  gold: {
    on: "border-amber-500/75 bg-amber-500/15 text-foreground shadow-sm ring-2 ring-amber-500/40 dark:bg-amber-500/12",
    off: "border-transparent bg-muted/25 text-muted-foreground hover:border-amber-500/30 hover:bg-amber-500/8",
  },
  premium: {
    on: "border-violet-500/70 bg-violet-500/14 text-foreground shadow-sm ring-2 ring-violet-500/35 dark:bg-violet-500/12",
    off: "border-transparent bg-muted/25 text-muted-foreground hover:border-violet-400/35 hover:bg-violet-500/8",
  },
  platinum: {
    on: "border-cyan-500/70 bg-cyan-500/12 text-foreground shadow-sm ring-2 ring-cyan-500/35 dark:bg-cyan-500/10",
    off: "border-transparent bg-muted/25 text-muted-foreground hover:border-cyan-400/35 hover:bg-cyan-500/8",
  },
}

export function SiteAdEditForm({ initial }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(initial.name)
  const [href, setHref] = useState(initial.href === "#" ? "" : initial.href)
  const [showOnHome, setShowOnHome] = useState(initial.showOnHome)
  const [showOnArticle, setShowOnArticle] = useState(initial.showOnArticle)
  const [isActive, setIsActive] = useState(initial.isActive)
  const [tier, setTier] = useState<SiteAdTierId>(
    normalizeSiteAdTier(initial.tier),
  )
  const [imageUrl, setImageUrl] = useState<string | null>(initial.imageUrl)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bannerPending, startBanner] = useTransition()

  const onPickBannerFile = useCallback(
    (file: File) => {
      setBannerError(null)
      const fd = new FormData()
      fd.set("file", file)
      startBanner(async () => {
        const r = await uploadSiteAdBannerAction(initial.id, fd)
        if (r.ok) {
          setImageUrl(r.url)
        } else {
          setBannerError(r.error)
        }
      })
    },
    [initial.id],
  )
  const [savePending, startSave] = useTransition()
  const [deletePending, startDelete] = useTransition()

  return (
    <div className="space-y-10">
      <div className="space-y-2" dir="rtl">
        <p className="text-sm font-medium leading-none">
          {ar.adminSiteAdBannerLabel}
        </p>
        <p className="text-xs text-muted-foreground">
          {ar.adminSiteAdBannerHint}
        </p>
        {bannerError ? (
          <p className="text-sm text-destructive" role="alert">
            {bannerError}
          </p>
        ) : null}
        <div
          className={cn(
            "relative flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 transition-colors",
            "hover:border-muted-foreground/40",
          )}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const f = e.dataTransfer.files?.[0]
            if (f) onPickBannerFile(f)
          }}
        >
          {imageUrl ? (
            <div className="relative aspect-[21/9] w-full max-w-2xl overflow-hidden rounded-md border bg-card">
              <Image
                src={imageUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="size-10 opacity-50" />
              <span className="text-sm">{ar.adminArticleCoverEmpty}</span>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onPickBannerFile(f)
              e.target.value = ""
            }}
          />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={bannerPending}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="ms-1 size-4" />
              {bannerPending
                ? ar.adminSiteAdUploading
                : imageUrl
                  ? ar.adminSiteAdBannerReplace
                  : ar.adminSiteAdBannerUpload}
            </Button>
            {imageUrl ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={bannerPending}
                onClick={() => {
                  setBannerError(null)
                  startBanner(async () => {
                    const r = await removeSiteAdBannerAction(initial.id)
                    if (r.ok) {
                      setImageUrl(null)
                    } else {
                      setBannerError(r.error)
                    }
                  })
                }}
              >
                <Trash2 className="ms-1 size-4" />
                {ar.adminArticleCoverRemove}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <form
        className="space-y-6 max-w-xl"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          startSave(async () => {
            const r = await updateSiteAdAction({
              id: initial.id,
              name,
              href,
              showOnHome,
              showOnArticle,
              isActive,
              tier,
            })
            if (r.ok === false) {
              setError(r.error)
              return
            }
            router.push("/admin/ads?saved=1")
            router.refresh()
          })
        }}
      >
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="ad-name">{ar.adminSiteAdFieldName}</Label>
          <Input
            id="ad-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-start"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ad-href">{ar.adminSiteAdFieldHref}</Label>
          <Input
            id="ad-href"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://…"
            className="text-start"
            dir="ltr"
          />
        </div>

        <div className="space-y-3">
          <Label id="ad-tier-label">{ar.adminSiteAdFieldTier}</Label>
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            role="radiogroup"
            aria-labelledby="ad-tier-label"
          >
            {TIER_ORDER.map((id) => {
              const selected = tier === id
              const surf = tierSurface[id]
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTier(id)}
                  className={cn(
                    "rounded-xl border-2 px-3 py-3 text-center text-sm font-semibold transition-all",
                    selected ? surf.on : surf.off,
                  )}
                >
                  {tierShortLabel(id)}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {ar.adminSiteAdTierHint}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <p className="text-sm font-medium leading-none">
            {ar.adminSiteAdSettingsTitle}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/60 px-4 py-3 shadow-sm">
              <span className="text-sm font-medium">{ar.adminSiteAdFieldShowHome}</span>
              <span dir="ltr" className="inline-flex shrink-0">
                <Switch
                  checked={showOnHome}
                  onCheckedChange={setShowOnHome}
                  aria-label={ar.adminSiteAdFieldShowHome}
                />
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/60 px-4 py-3 shadow-sm">
              <span className="text-sm font-medium">
                {ar.adminSiteAdFieldShowArticle}
              </span>
              <span dir="ltr" className="inline-flex shrink-0">
                <Switch
                  checked={showOnArticle}
                  onCheckedChange={setShowOnArticle}
                  aria-label={ar.adminSiteAdFieldShowArticle}
                />
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/60 px-4 py-3 shadow-sm">
              <span className="text-sm font-medium">{ar.adminSiteAdFieldActive}</span>
              <span dir="ltr" className="inline-flex shrink-0">
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  aria-label={ar.adminSiteAdFieldActive}
                />
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="submit" disabled={savePending}>
            {savePending ? ar.adminSiteAdSaving : ar.adminSiteAdSave}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/ads">{ar.adminSiteAdBack}</Link>
          </Button>
        </div>
      </form>

      <div className="border-t border-border pt-8">
        <Button
          type="button"
          variant="destructive"
          disabled={deletePending}
          onClick={() => {
            if (!window.confirm(ar.adminSiteAdDeleteConfirm)) return
            startDelete(async () => {
              const r = await deleteSiteAdAction(initial.id)
              if (r.ok) {
                router.push("/admin/ads")
                router.refresh()
              }
            })
          }}
        >
          {deletePending ? ar.adminSiteAdDeleting : ar.adminSiteAdDelete}
        </Button>
      </div>
    </div>
  )
}
