"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getDb } from "@/db/client"
import { articles, categories as categoriesTable } from "@/db/schema"
import { getAdminArticleById } from "@/lib/db-articles.server"
import { getCategories } from "@/lib/categories"
import { newsArticleCategoryBylineFromIds } from "@/lib/news-article-display"
import { tiptapEmptyDocument } from "@/lib/tiptap-empty-doc"
import { getArticlePath } from "@/lib/site-routes"
import { requireAdmin } from "@/lib/admin-guard.server"
import { deleteStoredImageIfR2 } from "@/lib/r2.server"
import { storeUploadedImage } from "@/lib/upload-image.server"
import {
  MAX_CATEGORIES,
  MAX_EXCERPT_LENGTH,
  MAX_TITLE_LENGTH,
  sanitizeTiptapBody,
} from "@/lib/tiptap-sanitize"
import { ar } from "@/lib/ui-ar"
import { and, eq, inArray } from "drizzle-orm"

export async function createDraftArticleAction() {
  await requireAdmin()
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
  isMemberOnly: boolean
  /** Optimistic-concurrency token: the `updatedAt` (ms or ISO) the editor last saw. */
  expectedUpdatedAt?: string | number | null
}

export async function updateArticleAction(
  input: UpdateArticleInput,
): Promise<
  | { ok: false; error: string; code?: "conflict" }
  | { ok: true; updatedAt: string }
> {
  await requireAdmin()
  const title = String(input.title ?? "").trim()
  const excerpt = String(input.excerpt ?? "").trim()
  if (title.length > MAX_TITLE_LENGTH || excerpt.length > MAX_EXCERPT_LENGTH) {
    return { ok: false, error: "العنوان أو الملخص أطول من المسموح." }
  }
  const sanitized = sanitizeTiptapBody(String(input.bodyJson ?? ""))
  if (!sanitized.ok) {
    return {
      ok: false,
      error: sanitized.reason === "size" ? "محتوى المقال كبير جداً." : ar.adminArticleErrorBody,
    }
  }
  const bodyJson = sanitized.json
  const categoryIds = Array.isArray(input.categoryIds)
    ? [...new Set(input.categoryIds.filter((c): c is string => typeof c === "string"))]
    : []
  if (categoryIds.length > MAX_CATEGORIES) {
    return { ok: false, error: "عدد الأقسام أكبر من المسموح." }
  }
  if (categoryIds.length > 0) {
    const found = await getDb()
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(inArray(categoriesTable.id, categoryIds))
    if (found.length !== categoryIds.length) {
      return { ok: false, error: "قسم غير صالح." }
    }
  }

  const [existing] = await getDb()
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.id, input.id))
    .limit(1)
  if (!existing) {
    return { ok: false, error: "المقال غير موجود." }
  }

  const firstCategory = categoryIds[0] ?? null
  const expectedMs =
    input.expectedUpdatedAt === null || input.expectedUpdatedAt === undefined
      ? null
      : typeof input.expectedUpdatedAt === "number"
        ? input.expectedUpdatedAt
        : Date.parse(input.expectedUpdatedAt)
  const now = new Date()

  // Compare-and-set: only write if nobody saved since this editor loaded/saved (e.g. another tab).
  const updated = await getDb()
    .update(articles)
    .set({
      title,
      excerpt,
      body: bodyJson,
      categoryId: firstCategory,
      isPublished: input.isPublished,
      isMemberOnly: input.isMemberOnly,
      updatedAt: now,
    })
    .where(
      expectedMs !== null && Number.isFinite(expectedMs)
        ? and(eq(articles.id, input.id), eq(articles.updatedAt, new Date(expectedMs)))
        : eq(articles.id, input.id),
    )
    .returning({ id: articles.id })
  if (updated.length === 0) {
    return {
      ok: false,
      code: "conflict",
      error: "تم تعديل هذا المقال من نافذة أخرى. أعد تحميل الصفحة قبل المتابعة حتى لا تفقد التغييرات.",
    }
  }

  revalidatePath("/admin/articles")
  revalidatePath(`/admin/articles/${input.id}`)
  revalidatePath(`/admin/articles/preview/${input.id}`)
  revalidatePath(getArticlePath(input.id))
  revalidatePath("/")
  revalidatePath("/category/all")
  for (const cat of categoryIds) {
    revalidatePath(`/category/${cat}`)
  }
  return { ok: true, updatedAt: now.toISOString() }
}

export async function setArticlePublishedAction(
  id: string,
  isPublished: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
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

export async function setArticleMemberOnlyAction(
  id: string,
  isMemberOnly: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
  const [existing] = await getDb()
    .select({
      id: articles.id,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1)
  if (!existing) {
    return { ok: false, error: "المقال غير موجود." }
  }

  await getDb()
    .update(articles)
    .set({ isMemberOnly, updatedAt: new Date() })
    .where(eq(articles.id, id))

  revalidatePath("/admin/articles")
  revalidatePath(`/admin/articles/${id}`)
  revalidatePath(`/admin/articles/preview/${id}`)
  revalidatePath(getArticlePath(id))
  revalidatePath("/")
  revalidatePath("/category/all")
  return { ok: true }
}

export async function uploadArticleCoverImageAction(
  articleId: string,
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin()
  const [existing] = await getDb()
    .select({ id: articles.id, coverImageUrl: articles.coverImageUrl })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1)
  if (!existing) {
    return { ok: false, error: "المقال غير موجود." }
  }

  const stored = await storeUploadedImage(formData.get("file"), `articles/${articleId}/cover`)
  if (!stored.ok) return stored

  await getDb()
    .update(articles)
    .set({ coverImageUrl: stored.url, updatedAt: new Date() })
    .where(eq(articles.id, articleId))

  // Delete the previous cover only after the new one is stored and saved (and never the same object).
  if (existing.coverImageUrl && existing.coverImageUrl !== stored.url) {
    await deleteStoredImageIfR2(existing.coverImageUrl)
  }

  revalidatePath("/admin/articles")
  revalidatePath(`/admin/articles/${articleId}`)
  revalidatePath(`/admin/articles/preview/${articleId}`)
  return { ok: true, url: stored.url }
}

export async function removeArticleCoverImageAction(
  articleId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
  const [row] = await getDb()
    .select({ coverImageUrl: articles.coverImageUrl })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1)
  if (!row) {
    return { ok: false, error: "المقال غير موجود." }
  }
  if (row.coverImageUrl) {
    await deleteStoredImageIfR2(row.coverImageUrl)
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
  await requireAdmin()
  const [existing] = await getDb()
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.id, articleId))
    .limit(1)
  if (!existing) {
    return { ok: false, error: "المقال غير موجود." }
  }
  return storeUploadedImage(formData.get("file"), `articles/${articleId}/inline`)
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
  await requireAdmin()
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
