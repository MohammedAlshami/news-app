import "server-only"

import { getUsers } from "@/lib/users"
import type { AdminUserListItem } from "@/lib/site-types"

export const ADMIN_PAGE_SIZE = 10

/**
 * Accounts live in the `AUTH_USERS` secret (see lib/users.ts), not in the database, so the admin lists
 * read from there. Read-only: passwords/hashes are never exposed, only id / email / role.
 */
export async function getAdminUserListPage(input: {
  page: number
  pageSize?: number
  role?: string
  q?: string
}): Promise<{ rows: AdminUserListItem[]; total: number }> {
  const pageSize = input.pageSize ?? ADMIN_PAGE_SIZE
  const page = Math.max(1, input.page)
  const q = (input.q ?? "").trim().toLowerCase()

  const all = getUsers()
    .filter((u) => (input.role ? u.role === input.role : true))
    .filter((u) => (q ? u.email.toLowerCase().includes(q) : true))
    .sort((a, b) => a.email.localeCompare(b.email))

  const offset = (page - 1) * pageSize
  return {
    total: all.length,
    rows: all.slice(offset, offset + pageSize).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.email.split("@")[0] ?? null,
      role: u.role,
      createdAt: "",
    })),
  }
}
