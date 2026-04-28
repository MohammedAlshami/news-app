"use client"



import type { Editor } from "@tiptap/core"

import Link from "next/link"

import { useRouter } from "next/navigation"

import { useRef, useState } from "react"



import { updateArticleAction } from "@/app/admin/articles/actions"

import { AdminCategoryModals } from "@/components/admin-category-modals"

import { ArticleCoverField } from "@/components/article-cover-field"

import { AdminCategorySelect } from "@/components/admin-category-select"

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import type { SiteCategory } from "@/lib/site-types"

import { ar } from "@/lib/ui-ar"

import { cn } from "@/lib/utils"



type Props = {

  categories: SiteCategory[]

  articleId: string

  initialTitle: string

  initialExcerpt: string

  initialDocument: Record<string, unknown>

  /** From DB: one id for now; empty → default to first category in the list. */

  initialCategoryIds: string[]

  initialCoverImageUrl: string | null

  initialIsPublished: boolean

}



export function CreateArticleForm({

  categories,

  articleId,

  initialTitle,

  initialExcerpt,

  initialDocument,

  initialCategoryIds,

  initialCoverImageUrl,

  initialIsPublished,

}: Props) {

  const router = useRouter()

  const [title, setTitle] = useState(initialTitle)

  const [excerpt, setExcerpt] = useState(initialExcerpt)

  const [categoryIds, setCategoryIds] = useState<Set<string>>(() => {

    if (initialCategoryIds.length > 0) {

      return new Set(initialCategoryIds)

    }

    if (categories.length > 0) {

      return new Set([categories[0].id])

    }

    return new Set()

  })

  const [error, setError] = useState<string | null>(null)

  const [pending, setPending] = useState(false)

  const [addCategoryOpen, setAddCategoryOpen] = useState(false)

  const [editCategoryOpen, setEditCategoryOpen] = useState(false)

  const [isPublished, setIsPublished] = useState(initialIsPublished)

  const editorRef = useRef<Editor | null>(null)



  return (

    <form

      className="space-y-6"

      onSubmit={async (e) => {

        e.preventDefault()

        setError(null)

        const json = editorRef.current?.getJSON()

        const bodyJson = json ? JSON.stringify(json) : ""

        const ids = [...categoryIds]

        setPending(true)

        const result = await updateArticleAction({

          id: articleId,

          title,

          excerpt,

          bodyJson,

          categoryIds: ids,

          isPublished,

        })

        setPending(false)

        if (result.ok === false) {

          setError(result.error)

        } else {

          router.push("/admin/articles?saved=1")

        }

      }}

    >

      {error ? (

        <p

          className="text-sm text-destructive"

          role="alert"

        >

          {error}

        </p>

      ) : null}
      {categories.length === 0 ? (
        <p
          className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
          role="status"
        >
          {ar.adminArticleNoCategoriesBanner}
        </p>
      ) : null}
      <ArticleCoverField

        key={`${articleId}-${initialCoverImageUrl ?? "none"}`}

        articleId={articleId}

        initialUrl={initialCoverImageUrl}

      />

      <div className="space-y-2">

        <Label htmlFor="article-title">{ar.adminArticleFieldTitle}</Label>

        <Input

          id="article-title"

          name="title"

          value={title}

          onChange={(e) => {

            setTitle(e.target.value)

          }}

          required

        />

      </div>



      <div className="space-y-2">

        <Label htmlFor="article-excerpt">{ar.adminArticleFieldExcerpt}</Label>

        <Textarea

          id="article-excerpt"

          name="excerpt"

          rows={4}

          dir="rtl"

          value={excerpt}

          onChange={(e) => {

            setExcerpt(e.target.value)

          }}

          required

        />

      </div>



      <div

        className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card/50 p-4"

        dir="rtl"

      >

        <div className="space-y-0.5">

          <Label

            htmlFor="article-published"

            className="text-sm font-medium"

          >

            {ar.adminArticlePublishToggle}

          </Label>

          <p className="text-xs text-muted-foreground">

            {ar.adminArticlePublishHint}

          </p>

        </div>

        <Switch

          id="article-published"

          checked={isPublished}

          onCheckedChange={setIsPublished}

          aria-label={ar.adminArticlePublishToggle}

        />

      </div>



      <div className="space-y-2">

        <div

          className="flex items-center justify-between gap-3"

          dir="rtl"

        >

          <p

            className="text-sm font-medium leading-none"

            id="admin-article-categories"

          >

            {ar.adminArticleFieldCategories}

          </p>

          <div className="flex shrink-0 gap-2">

            <Button

              type="button"

              variant="outline"

              size="sm"

              onClick={() => {

                setAddCategoryOpen(true)

              }}

            >

              {ar.adminCategoryAddButton}

            </Button>

            <Button

              type="button"

              variant="outline"

              size="sm"

              disabled={categories.length === 0}

              onClick={() => {

                setEditCategoryOpen(true)

              }}

            >

              {ar.adminCategoryEditButton}

            </Button>

          </div>

        </div>

        <AdminCategoryModals

          categories={categories}

          addOpen={addCategoryOpen}

          onAddOpenChange={setAddCategoryOpen}

          editOpen={editCategoryOpen}

          onEditOpenChange={setEditCategoryOpen}

        />

        <AdminCategorySelect

          categories={categories}

          selectedIds={categoryIds}

          onChange={setCategoryIds}

          aria-labelledby="admin-article-categories"

        />

      </div>



      <div className="space-y-2">

        <span className="text-sm font-medium leading-none">

          {ar.adminArticleFieldBody}

        </span>

        <div

          className={cn(

            "min-h-60 max-w-full overflow-x-hidden rounded-lg border border-border bg-card",

            "isolated",

          )}

          dir="rtl"

        >

          <SimpleEditor

            embedded

            key={articleId}

            articleId={articleId}

            initialDocument={initialDocument}

            onEditorReady={(ed) => {

              editorRef.current = ed

            }}

          />

        </div>

      </div>



      <div className="flex flex-wrap items-center gap-2">

        <Button

          type="submit"

          disabled={pending || categories.length === 0}

        >

          {pending ? ar.adminArticleSaving : ar.adminArticleSave}

        </Button>

        <Button

          type="button"

          variant="outline"

          asChild

        >

          <Link href="/admin/articles">{ar.adminArticleCancel}</Link>

        </Button>

      </div>

    </form>

  )

}

