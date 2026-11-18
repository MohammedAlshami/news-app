import "server-only"

import { NextResponse } from "next/server"
import { redirect } from "next/navigation"

import { getAuthSessionUserId } from "@/lib/auth-session.server"
import { isCronAuthorized } from "@/lib/auth/cron"
import { type AppUser, getUserById } from "@/lib/users"

/** The signed-in user, or undefined. */
export async function getCurrentUser(): Promise<AppUser | undefined> {
  const id = await getAuthSessionUserId()
  return id ? getUserById(id) : undefined
}

/**
 * Call as the FIRST line of every admin server action and admin-only page/route handler that is not
 * covered by a layout redirect (layouts do not protect server actions — actions are directly POSTable).
 */
export async function requireAdmin(): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role !== "admin") redirect("/user")
  return user
}

/** For API route handlers: returns a 401/403 response to send, or null when the caller is an admin. */
export async function requireAdminApi(): Promise<NextResponse | null> {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (user.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 })
  return null
}

/** For `/api/cron/*`: returns a 401 response to send, or null when the request carries the CRON_SECRET. */
export async function requireCronSecret(request: Request): Promise<NextResponse | null> {
  if (await isCronAuthorized(request.headers, process.env.CRON_SECRET)) return null
  return NextResponse.json({ error: "unauthorized" }, { status: 401 })
}

/** Cron routes also accept a logged-in admin (for manual runs from the admin UI). */
export async function requireCronOrAdmin(request: Request): Promise<NextResponse | null> {
  if (await isCronAuthorized(request.headers, process.env.CRON_SECRET)) return null
  return requireAdminApi()
}
