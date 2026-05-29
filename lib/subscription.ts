import "server-only"

import { getAuthSessionUserId } from "@/lib/auth-session.server"

export async function isSubscribed(): Promise<boolean> {
  const userId = await getAuthSessionUserId()
  return userId !== undefined
}
