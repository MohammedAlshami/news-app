import { fromB64url, timingSafeEqual, toB64url } from "./crypto"

/** Cloudflare Workers caps PBKDF2 at 100 000 iterations, so that is both the default and the maximum. */
export const PBKDF2_ITERATIONS = 100_000
const PREFIX = "pbkdf2-sha256"

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"])
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256,
  )
  return new Uint8Array(bits)
}

/** Format: `pbkdf2-sha256$<iterations>$<salt>$<hash>` (base64url). */
export async function hashPassword(password: string, iterations = PBKDF2_ITERATIONS): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derive(password, salt, iterations)
  return `${PREFIX}$${iterations}$${toB64url(salt)}$${toB64url(hash)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [prefix, iter, salt, hash] = stored.split("$")
    const iterations = Number(iter)
    if (prefix !== PREFIX || !Number.isInteger(iterations) || iterations < 1 || iterations > PBKDF2_ITERATIONS) {
      return false
    }
    const actual = await derive(password, fromB64url(salt), iterations)
    return timingSafeEqual(actual, fromB64url(hash))
  } catch {
    return false
  }
}
