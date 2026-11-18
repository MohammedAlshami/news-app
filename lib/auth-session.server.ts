import "server-only"

import { cookies } from "next/headers"

import { AUTH_SESSION_COOKIE } from "@/lib/auth"
import { verifySessionToken } from "@/lib/auth/session"

/** Returns the user id from a validly signed, unexpired session cookie, otherwise undefined. */
export async function getAuthSessionUserId(): Promise<string | undefined> {
  const c = await cookies()
  const token = c.get(AUTH_SESSION_COOKIE)?.value
  return (await verifySessionToken(token, process.env.SESSION_SECRET)) ?? undefined
}
