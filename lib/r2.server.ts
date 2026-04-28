import "server-only"

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getRuntimeEnv } from "@/lib/cloudflare-runtime-env"

/**
 * Cloudflare R2 (S3-compatible). Set env vars in `.env.local` after creating
 * a bucket and API token (R2: Object Read & Write on that bucket).
 */
export function isR2Configured(): boolean {
  return Boolean(
    getRuntimeEnv("R2_ACCOUNT_ID") &&
      getRuntimeEnv("R2_ACCESS_KEY_ID") &&
      getRuntimeEnv("R2_SECRET_ACCESS_KEY") &&
      getRuntimeEnv("R2_BUCKET_NAME") &&
      getRuntimeEnv("R2_PUBLIC_URL"),
  )
}

function requireR2Config(): {
  client: S3Client
  bucket: string
  publicBase: string
} {
  if (!isR2Configured()) {
    throw new Error("R2 is not configured (missing env vars).")
  }
  const accountId = getRuntimeEnv("R2_ACCOUNT_ID")!
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: getRuntimeEnv("R2_ACCESS_KEY_ID")!,
      secretAccessKey: getRuntimeEnv("R2_SECRET_ACCESS_KEY")!,
    },
  })
  return {
    client,
    bucket: getRuntimeEnv("R2_BUCKET_NAME")!,
    publicBase: getRuntimeEnv("R2_PUBLIC_URL")!.replace(/\/$/, ""),
  }
}

export function publicUrlForR2Key(key: string): string {
  const { publicBase } = requireR2Config()
  const k = key.replace(/^\//, "")
  return `${publicBase}/${k}`
}

export async function putR2Object(params: {
  key: string
  body: Buffer
  contentType: string
}): Promise<string> {
  const { client, bucket, publicBase } = requireR2Config()
  const key = params.key.replace(/^\//, "")
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  )
  return `${publicBase}/${key}`
}

export async function deleteR2ObjectByKey(key: string): Promise<void> {
  const { client, bucket } = requireR2Config()
  const k = key.replace(/^\//, "")
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: k,
    }),
  )
}

/** Public article/cover URL stored in DB: either `https://…/path` (R2) or `/uploads/…` (local). */
export async function deleteStoredImageIfR2(storedUrl: string): Promise<void> {
  if (!storedUrl) return
  if (!isR2Configured()) return
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
