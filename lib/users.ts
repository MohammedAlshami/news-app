import { type AuthUser, parseUsers } from "@/lib/auth/users-config"
import { verifyPassword } from "@/lib/auth/password"

export type AppUser = AuthUser

/** Users live in the `AUTH_USERS` secret (JSON with PBKDF2 hashes) — never in the repository. */
export function getUsers(): AppUser[] {
  return parseUsers(process.env.AUTH_USERS)
}

export function getUserById(id: string): AppUser | undefined {
  return getUsers().find((u) => u.id === id)
}

/** A real-looking hash verified when the email is unknown, so response time doesn't reveal which emails exist. */
const DUMMY_HASH = "pbkdf2-sha256$100000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"

export async function verifyLogin(email: string, password: string): Promise<AppUser | undefined> {
  const e = email.trim().toLowerCase()
  const user = getUsers().find((u) => u.email.toLowerCase() === e)
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH)
  return user && ok ? user : undefined
}
