/**
 * Usage:  pnpm auth:hash-password '<password>'
 * Prints a PBKDF2 hash to place in the AUTH_USERS secret:
 *   [{"id":"<uuid>","email":"you@example.com","role":"admin","passwordHash":"<hash>"}]
 */
import { randomUUID } from "node:crypto"

import { hashPassword } from "../lib/auth/password"

const password = process.argv[2]
if (!password || password.length < 12) {
  console.error("Usage: pnpm auth:hash-password '<password of at least 12 characters>'")
  process.exit(1)
}

console.log(JSON.stringify({ id: randomUUID(), role: "admin", passwordHash: await hashPassword(password) }, null, 2))
