"use server"

import { randomUUID } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getDb } from "@/db/client"
import { articles } from "@/db/schema"
import { getAdminArticleById } from "@/lib/db-articles.server"
import { getCategories } from "@/lib/categories"
import { newsArticleCategoryBylineFromIds } from "@/lib/news-article-display"
import { tiptapEmptyDocument } from "@/lib/tiptap-empty-doc"
import { getArticlePath } from "@/lib/site-routes"
import {
  deleteStoredImageIfR2,
  isR2Configured,
  putR2Object,
} from "@/lib/r2.server"
import { ar } from "@/lib/ui-ar"
import { eq } from "drizzle-orm"

export async function createDraftArticleAction() {
  const bodyJson = JSON.stringify(tiptapEmptyDocument)
  const [row] = await getDb()
    .insert(articles)
    .values({
      title: "",
      excerpt: "",
      body: bodyJson,
      isPublished: false,
    })
    .returning({ id: articles.id })

  if (!row) {
    throw new Error("createDraftArticleAction: insert failed")
  }

  revalidatePath("/admin/articles")
  redirect(`/admin/articles/${row.id}`)
}

export type UpdateArticleInput = {
  id: string
  title: string
  excerpt: string
  /** Tiptap JSON (stringified) */
  bodyJson: string
  categoryIds: string[]
  isPublished: boolean
}

export async function updateArticleAction(
  input: UpdateArticleInput,
): Promise<{ ok: false; error: string } | { ok: true }> {
  const title = input.title.trim()
  const excerpt = input.excerpt.trim()
  const bodyJson = input.bodyJson.trim()
  if (!title) {
    return { ok: false, error: ar.adminArticleErrorTitle }
  }
  if (!excerpt) {
    return { ok: false, error: ar.adminArticleErrorExcerpt }
  }
  if (!bodyJson) {
    return { ok: false, error: ar.adminArticleErrorBody }
  }
  if (input.categoryIds.length === 0) {
    return { ok: false, error: ar.adminArticleErrorCategory }
  }

  let parsed: { type?: string } | null = null
  try {
    parsed = JSON.parse(bodyJson) as { type?: string }
  } catch {
    return { ok: false, error: ar.adminArticleErrorBody }
  }
  if (parsed?.type !== "doc") {
    return { ok: false, error: ar.adminArticleErrorBody }
  }

  const [existing] = await getDb()
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.id, input.id))
    .limit(1)
  if (!existing) {
    return { ok: false, error: "المقال غير موجود." }
  }

  const firstCategory = input.categoryIds[0] ?? null

  await getDb()
    .update(articles)
    .set({
      title,
      excerpt,
      body: bodyJson,
      categoryId: firstCategory,
      isPublished: input.isPublished,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, input.id))

  revalidatePath("/admin/articles")
  revalidatePath(`/admin/articles/${input.id}`)
  revalidatePath(`/admin/articles/preview/${input.id}`)
  revalidatePath(getArticlePath(input.id))
  revalidatePath("/")
  revalidatePath("/category/all")
  for (const cat of input.categoryIds) {
    revalidatePath(`/category/${cat}`)
  }
  return { ok: true }
}

export async function setArticlePublishedAction(
  id: string,
  isPublished: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [existing] = await getDb()
    .select({
      id: articles.id,
      categoryId: articles.categoryId,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1)
  if (!existing) {
    return { ok: false, error: "المقال غير موجود." }
  }

  await getDb()
    .update(articles)
    .set({ isPublished, updatedAt: new Date() })
    .where(eq(articles.id, id))

  revalidatePath("/admin/articles")
  revalidatePath(`/admin/articles/${id}`)
  revalidatePath(`/admin/articles/preview/${id}`)
  revalidatePath(getArticlePath(id))
  revalidatePath("/")
  revalidatePath("/category/all")
  if (existing.categoryId) {
    revalidatePath(`/category/${existing.categoryId}`)
  }
  return { ok: true }
}

const coverMimeToExt: Record<string, "jpg" | "png" | "webp" | "gif"> = {
  "image/jpeg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

export async function uploadArticleCoverImageAction(
  articleId: string,
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "لم يُرسل ملف." }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "الحجم بحد أقصى 5 ميغابايت." }
  }

  const fromMime = coverMimeToExt[file.type]
  const finalExt =
    fromMime || (() => {
      const raw = (file.name.split(".").pop() || "").toLowerCase()
      if (raw === "jpeg" || raw === "jpg") return "jpg" as const
      if (raw === "png" || raw === "webp" || raw === "gif") {
        return raw
      }
      return null
    })()
  if (!finalExt) {
    return { ok: false, error: "يُقبل فقط صورة (JPEG, PNG, WebP, GIF)." }
  }

  const [existing] = await getDb()
    .select({ id: articles.id, coverImageUrl: articles.coverImageUrl })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1)
  if (!existing) {
    return { ok: false, error: "المقال غير موجود." }
  }
  if (existing.coverImageUrl) {
    const rel = existing.coverImageUrl
    if (/^https?:\/\//i.test(rel)) {
      await deleteStoredImageIfR2(rel)
    } else if (rel.startsWith("/")) {
      const abs = join(process.cwd(), "public", rel)
      try {
        await unlink(abs)
      } catch {
        // ignore
      }
    }
  }

  const name = `cover.${String(finalExt)}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const contentType =
    file.type ||
    (finalExt === "jpg" ? "image/jpeg" : `image/${finalExt}`)

  let publicUrl: string
  if (isR2Configured()) {
    const key = `articles/${articleId}/${name}`
    publicUrl = await putR2Object({
      key,
      body: buffer,
      contentType,
    })
  } else {
    const dir = join(
      process.cwd(),
      "public",
      "uploads",
      "articles",
      articleId,
    )
    await mkdir(dir, { recursive: true })
    const outPath = join(dir, name)
    await writeFile(outPath, buffer)
    publicUrl = `/uploads/articles/${articleId}/${name}`
  }

  await getDb()
    .update(articles)
    .set({
      coverImageUrl: publicUrl,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, articleId))

  revalidatePath("/admin/articles")
  revalidatePath(`/admin/articles/${articleId}`)
  revalidatePath(`/admin/articles/preview/${articleId}`)
  return { ok: true, url: publicUrl }
}

export async function removeArticleCoverImageAction(
  articleId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [row] = await getDb()
    .select({ coverImageUrl: articles.coverImageUrl })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1)
  if (!row) {
    return { ok: false, error: "المقال غير موجود." }
  }
  if (row.coverImageUrl) {
    const rel = row.coverImageUrl
    if (/^https?:\/\//i.test(rel)) {
      await deleteStoredImageIfR2(rel)
    } else if (rel.startsWith("/")) {
      const abs = join(process.cwd(), "public", rel)
      try {
        await unlink(abs)
      } catch {
        // ignore
      }
    }
  }
  await getDb()
    .update(articles)
    .set({ coverImageUrl: null, updatedAt: new Date() })
    .where(eq(articles.id, articleId))
  revalidatePath("/admin/articles")
  revalidatePath(`/admin/articles/${articleId}`)
  revalidatePath(`/admin/articles/preview/${articleId}`)
  return { ok: true }
}

export async function uploadArticleInlineImageAction(
  articleId: string,
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "لم يُرسل ملف." }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "الحجم بحد أقصى 5 ميغابايت." }
  }

  const fromMime = coverMimeToExt[file.type]
  const finalExt =
    fromMime || (() => {
      const raw = (file.name.split(".").pop() || "").toLowerCase()
      if (raw === "jpeg" || raw === "jpg") return "jpg" as const
      if (raw === "png" || raw === "webp" || raw === "gif") {
        return raw
      }
      return null
    })()
  if (!finalExt) {
    return { ok: false, error: "يُقبل فقط صورة (JPEG, PNG, WebP, GIF)." }
  }

  const [existing] = await getDb()
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1)
  if (!existing) {
    return { ok: false, error: "المقال غير موجود." }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const contentType =
    file.type ||
    (finalExt === "jpg" ? "image/jpeg" : `image/${finalExt}`)
  const id = randomUUID()
  const filename = `${id}.${finalExt}`

  if (isR2Configured()) {
    const key = `articles/${articleId}/inline/${filename}`
    const url = await putR2Object({
      key,
      body: buffer,
      contentType,
    })
    return { ok: true, url }
  }

  const dir = join(
    process.cwd(),
    "public",
    "uploads",
    "articles",
    articleId,
    "inline",
  )
  await mkdir(dir, { recursive: true })
  const outPath = join(dir, filename)
  await writeFile(outPath, buffer)
  return {
    ok: true,
    url: `/uploads/articles/${articleId}/inline/${filename}`,
  }
}

export type AdminArticlePreviewData = {
  id: string
  title: string
  excerpt: string
  /** `YYYY-MM-DD` */
  date: string
  categoryByline: string
  body: string
  coverImageUrl: string | null
}

export async function getAdminArticlePreviewDataAction(
  id: string,
): Promise<
  | { ok: true; data: AdminArticlePreviewData }
  | { ok: false; error: string }
> {
  const [row, categories] = await Promise.all([
    getAdminArticleById(id),
    getCategories(),
  ])
  if (!row) {
    return { ok: false, error: "المقال غير موجود." }
  }
  const categoryIds = row.categoryId ? [row.categoryId] : []
  const categoryByline = newsArticleCategoryBylineFromIds(
    categoryIds,
    categories,
  )
  return {
    ok: true,
    data: {
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      date: row.createdAt.toISOString().slice(0, 10),
      categoryByline,
      body: row.body,
      coverImageUrl: row.coverImageUrl,
    },
  }
}
