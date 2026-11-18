import { fromB64url, hmacSign, hmacVerify, toB64url } from "./crypto"

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
const VERSION = "v1"
const MIN_SECRET_LENGTH = 32

function assertSecret(secret: string | undefined): string {
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`SESSION_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters`)
  }
  return secret
}

/** `v1.<payload>.<hmac>` where payload = base64url(JSON {u: userId, e: expiry (unix seconds)}). */
export async function createSessionToken(
  userId: string,
  secret: string | undefined,
  now = Date.now(),
  ttlSeconds = SESSION_TTL_SECONDS,
): Promise<string> {
  const key = assertSecret(secret)
  const payload = toB64url(
    new TextEncoder().encode(JSON.stringify({ u: userId, e: Math.floor(now / 1000) + ttlSeconds })),
  )
  const body = `${VERSION}.${payload}`
  return `${body}.${await hmacSign(key, body)}`
}

/** Returns the user id for a valid, unexpired token, otherwise null. Never throws on malformed input. */
export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
): Promise<string | null> {
  if (!token || !secret || secret.length < MIN_SECRET_LENGTH) return null
  const parts = token.split(".")
  if (parts.length !== 3 || parts[0] !== VERSION) return null
  if (!(await hmacVerify(secret, `${parts[0]}.${parts[1]}`, parts[2]))) return null
  try {
    const { u, e } = JSON.parse(new TextDecoder().decode(fromB64url(parts[1]))) as { u?: unknown; e?: unknown }
    if (typeof u !== "string" || typeof e !== "number" || e * 1000 <= now) return null
    return u
  } catch {
    return null
  }
}
