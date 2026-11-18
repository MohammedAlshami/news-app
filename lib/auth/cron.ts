import { secretsEqual } from "./crypto"

/** True when the request carries `Authorization: Bearer <CRON_SECRET>` (or `x-cron-secret`). Fails closed if no secret is configured. */
export async function isCronAuthorized(headers: Headers, secret: string | undefined): Promise<boolean> {
  if (!secret || secret.length < 16) return false
  const bearer = headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const provided = bearer ?? headers.get("x-cron-secret") ?? ""
  return provided.length > 0 && (await secretsEqual(provided, secret))
}
