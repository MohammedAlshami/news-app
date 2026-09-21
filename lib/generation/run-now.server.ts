import "server-only"

import { getDb } from "@/db/client"
import { openRouterJson } from "@/lib/llm-json"
import { uploadCoverWithDedup } from "@/lib/upload-image-dedup.server"

import { runGeneration, type GenEvent } from "./core"

/** Production wiring: real DB, OpenRouter, R2 cover upload. */
export function runGenerationNow(opts: { max: number; concurrency: number; onEvent?: (e: GenEvent) => void }) {
  return runGeneration(
    {
      db: getDb(),
      llm: openRouterJson,
      uploadCover: uploadCoverWithDedup,
      log: (m) => console.log(`[write] ${m}`),
    },
    opts,
  )
}
