"use client"

import { useEffect } from "react"

import { incrementArticleViewAction } from "@/lib/view-actions"

export function TrackArticleView({ articleId }: { articleId: string }) {
  useEffect(() => {
    incrementArticleViewAction(articleId)
  }, [articleId])
  return null
}
