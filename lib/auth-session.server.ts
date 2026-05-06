import "server-only"

import { cookies } from "next/headers"

import { AUTH_SESSION_COOKIE } from "@/lib/auth"

export async function getAuthSessionUserId(): Promise<string | undefined> {
  const c = await cookies()
  return c.get(AUTH_SESSION_COOKIE)?.value
}
