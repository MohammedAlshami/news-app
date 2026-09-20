import "server-only"

import { getCloudflareContext } from "@opennextjs/cloudflare"

/** Returns the `MEDIA` R2 binding. There is no env-var fallback. */
export function getMediaBucket(): CloudflareEnv["MEDIA"] {
  const { env } = getCloudflareContext()
  const bucket = (env as CloudflareEnv).MEDIA
  if (!bucket) {
    throw new Error("Cloudflare R2 binding `MEDIA` is not available.")
  }
  return bucket
}