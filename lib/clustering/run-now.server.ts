import "server-only"

import { getDb } from "@/db/client"
import { openRouterJson } from "@/lib/llm-json"
import { OPENROUTER_API_KEY } from "@/lib/openrouter"

import { runClustering } from "./run"

/** Production wiring: real DB + OpenRouter (LLM steps are skipped when no key is configured). */
export async function runClusteringNow() {
  return runClustering({
    db: getDb(),
    llm: OPENROUTER_API_KEY ? openRouterJson : undefined,
    log: (m) => console.log(`[cluster] ${m}`),
  })
}
