/**
 * Local draft backup for the article form. localStorage can be missing/blocked/full, so every
 * access is wrapped; failures are silent (the backup is best effort).
 */
export type ArticleDraft = {
  v: 1
  savedAt: number
  /** Server `updatedAt` (ms) the draft was based on, when known. */
  baseUpdatedAt: number | null
  title: string
  excerpt: string
  categoryIds: string[]
  isPublished: boolean
  isMemberOnly: boolean
  bodyJson: string
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">

export const draftKey = (articleId: string) => `news-app:article-draft:${articleId}`

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage
  } catch {
    return null
  }
}

export function writeDraft(
  articleId: string,
  draft: Omit<ArticleDraft, "v" | "savedAt"> & { savedAt?: number },
  storage: StorageLike | null = defaultStorage(),
  now: () => number = Date.now,
): boolean {
  if (!storage) return false
  try {
    const payload: ArticleDraft = { ...draft, v: 1, savedAt: draft.savedAt ?? now() }
    storage.setItem(draftKey(articleId), JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

export function readDraft(
  articleId: string,
  storage: StorageLike | null = defaultStorage(),
): ArticleDraft | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(draftKey(articleId))
    if (!raw) return null
    const d = JSON.parse(raw) as Partial<ArticleDraft>
    if (
      d?.v !== 1 ||
      typeof d.savedAt !== "number" ||
      typeof d.title !== "string" ||
      typeof d.excerpt !== "string" ||
      typeof d.bodyJson !== "string" ||
      !Array.isArray(d.categoryIds) ||
      typeof d.isPublished !== "boolean" ||
      typeof d.isMemberOnly !== "boolean"
    ) {
      return null
    }
    return {
      v: 1,
      savedAt: d.savedAt,
      baseUpdatedAt: typeof d.baseUpdatedAt === "number" ? d.baseUpdatedAt : null,
      title: d.title,
      excerpt: d.excerpt,
      categoryIds: d.categoryIds.filter((c): c is string => typeof c === "string"),
      isPublished: d.isPublished,
      isMemberOnly: d.isMemberOnly,
      bodyJson: d.bodyJson,
    }
  } catch {
    return null
  }
}

export function clearDraft(articleId: string, storage: StorageLike | null = defaultStorage()) {
  if (!storage) return
  try {
    storage.removeItem(draftKey(articleId))
  } catch {
    // ignore
  }
}

/**
 * Decide what to do with a stored draft on load:
 *  - "none": nothing to offer (no draft, or identical to the server copy)
 *  - "restore": unsaved edits on top of the version we loaded
 *  - "stale": unsaved edits, but the article was saved elsewhere after the draft's base version;
 *    offer it with a warning (restoring would overwrite the newer server copy on next save).
 */
export function classifyDraft(
  draft: ArticleDraft | null,
  serverSnapshot: string,
  draftSnapshot: string | null,
  serverUpdatedAt: number | null,
): "none" | "restore" | "stale" {
  if (!draft || draftSnapshot === null) return "none"
  if (draftSnapshot === serverSnapshot) return "none"
  if (
    serverUpdatedAt !== null &&
    draft.baseUpdatedAt !== null &&
    draft.baseUpdatedAt < serverUpdatedAt
  ) {
    return "stale"
  }
  return "restore"
}
