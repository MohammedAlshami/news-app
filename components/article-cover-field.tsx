"use client"

import Image from "next/image"
import { useCallback, useRef, useState, useTransition } from "react"

import {
  removeArticleCoverImageAction,
  uploadArticleCoverImageAction,
} from "@/app/admin/articles/actions"
import { Button } from "@/components/ui/button"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"
import { ImageIcon, Trash2, Upload } from "lucide-react"

type Props = {
  articleId: string
  initialUrl: string | null
  className?: string
}

export function ArticleCoverField({ articleId, initialUrl, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onPickFile = useCallback(
    (file: File) => {
      setError(null)
      const fd = new FormData()
      fd.set("file", file)
      startTransition(async () => {
        const r = await uploadArticleCoverImageAction(articleId, fd)
        if (r.ok) {
          setUrl(r.url)
        } else {
          setError(r.error)
        }
      })
    },
    [articleId],
  )

  return (
    <div className={cn("space-y-2", className)} dir="rtl">
      <p className="text-sm font-medium leading-none">
        {ar.adminArticleCoverLabel}
      </p>
      <p className="text-xs text-muted-foreground">
        {ar.adminArticleCoverHint}
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
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
          if (f) {
            onPickFile(f)
          }
        }}
      >
        {url ? (
          <div className="relative aspect-[21/9] w-full max-w-2xl overflow-hidden rounded-md border bg-card">
            <Image
              src={url}
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
            if (f) onPickFile(f)
            e.target.value = ""
          }}
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => {
              inputRef.current?.click()
            }}
          >
            <Upload className="ms-1 size-4" />
            {url ? ar.adminArticleCoverReplace : ar.adminArticleCoverUpload}
          </Button>
          {url ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                setError(null)
                startTransition(async () => {
                  const r = await removeArticleCoverImageAction(articleId)
                  if (r.ok) {
                    setUrl(null)
                  } else {
                    setError(r.error)
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
  )
}
