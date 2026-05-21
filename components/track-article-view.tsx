"use client"

import { useEffect } from "react"

import { incrementArticleViewAction } from "@/app/admin/articles/actions"

export function TrackArticleView({ articleId }: { articleId: string }) {
  useEffect(() => {
    incrementArticleViewAction(articleId)
  }, [articleId])
  return null
}
