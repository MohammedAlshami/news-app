"use client"

import { useState } from "react"

import { AdminGenerateArticleModal } from "@/components/admin-generate-article-modal"
import { Button } from "@/components/ui/button"

export function AdminGeneratedArticlesClient() {
  const [generateOpen, setGenerateOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setGenerateOpen(true)}>توليد مقالة</Button>

      <AdminGenerateArticleModal
        open={generateOpen}
        onOpenChange={setGenerateOpen}
      />
    </>
  )
}
