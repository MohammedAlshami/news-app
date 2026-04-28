"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { categories } from "@/db/schema"
import { ALL_CATEGORIES_ID } from "@/lib/site-routes"

function revalidateCategoryRoutes(newCategoryId?: string) {
  revalidatePath("/admin/articles")
  revalidatePath("/")
  revalidatePath(`/category/${ALL_CATEGORIES_ID}`)
  if (newCategoryId) {
    revalidatePath(`/category/${newCategoryId}`)
  }
}

export async function createCategoryAction(input: {
  name: string
  description: string
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const name = input.name.trim()
  if (!name) {
    return { ok: false, error: "اسم القسم مطلوب." }
  }
  const description = input.description.trim()

  const [row] = await getDb()
    .insert(categories)
    .values({
      name,
      description: description || null,
    })
    .returning({ id: categories.id })

  if (!row) {
    return { ok: false, error: "تعذّر إنشاء القسم." }
  }

  revalidateCategoryRoutes(row.id)
  return { ok: true, id: row.id }
}

export async function updateCategoryAction(input: {
  id: string
  name: string
  description: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim()
  if (!name) {
    return { ok: false, error: "اسم القسم مطلوب." }
  }
  const description = input.description.trim()

  const updated = await getDb()
    .update(categories)
    .set({
      name,
      description: description || null,
    })
    .where(eq(categories.id, input.id))
    .returning({ id: categories.id })

  if (updated.length === 0) {
    return { ok: false, error: "القسم غير موجود." }
  }

  revalidateCategoryRoutes()
  revalidatePath(`/category/${input.id}`)
  return { ok: true }
}
