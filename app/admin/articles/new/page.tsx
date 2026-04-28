import { permanentRedirect } from "next/navigation"

/**
 * Replaced by creating a draft (Neon) and opening `/admin/articles/[id]`.
 * Old links go to the list; use «مقال جديد» there to start a draft.
 */
export default function AdminNewArticleRedirect() {
  permanentRedirect("/admin/articles")
}
