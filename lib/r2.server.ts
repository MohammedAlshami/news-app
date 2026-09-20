import "server-only"

import { getMediaBucket } from "@/lib/cloudflare-bindings"
import { getRuntimeEnv } from "@/lib/cloudflare-runtime-env"

/**
 * Cloudflare R2 access is binding-only (`MEDIA`). No S3 credentials/env fallback.
 * The only configuration needed is the public base URL, exposed by the bucket's
 * `r2.dev` domain (or a custom domain) via the `R2_PUBLIC_URL` var.
 */
function getPublicBase(): string {
  const base = getRuntimeEnv("R2_PUBLIC_URL")
  if (!base) {
    throw new Error("R2_PUBLIC_URL is not configured.")
  }
  return base.replace(/\/$/, "")
}

export async function putR2Object(params: {
  key: string
  body: Buffer
  contentType: string
}): Promise<string> {
  const key = params.key.replace(/^\//, "")
  await getMediaBucket().put(key, params.body, {
    httpMetadata: { contentType: params.contentType },
  })
  return `${getPublicBase()}/${key}`
}

export async function deleteR2ObjectByKey(key: string): Promise<void> {
  const k = key.replace(/^\//, "")
  await getMediaBucket().delete(k)
}

/** Public article/cover URL stored in DB: either `https://…/path` (R2) or `/uploads/…` (legacy local). */
export async function deleteStoredImageIfR2(storedUrl: string): Promise<void> {
  if (!storedUrl) return
  if (!/^https?:\/\//i.test(storedUrl)) return
  try {
    const path = new URL(storedUrl).pathname.replace(/^\//, "")
    if (path) {
      await deleteR2ObjectByKey(path)
    }
  } catch {
    // ignore invalid URL
  }
}