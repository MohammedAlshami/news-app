export type AuthRole = "admin" | "user"
export type AuthUser = { id: string; email: string; role: AuthRole; passwordHash: string }

/**
 * Users come from the `AUTH_USERS` secret (JSON array), never from the repository:
 *   [{"id":"…","email":"a@b.c","role":"admin","passwordHash":"pbkdf2-sha256$100000$…"}]
 * Generate hashes with `pnpm auth:hash-password`.
 */
export function parseUsers(raw: string | undefined): AuthUser[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (u): u is AuthUser =>
        !!u &&
        typeof u.id === "string" &&
        typeof u.email === "string" &&
        (u.role === "admin" || u.role === "user") &&
        typeof u.passwordHash === "string",
    )
  } catch {
    return []
  }
}
