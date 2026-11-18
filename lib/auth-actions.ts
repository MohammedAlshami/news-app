"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import { AUTH_SESSION_COOKIE } from "@/lib/auth"
import { createSessionToken, SESSION_TTL_SECONDS } from "@/lib/auth/session"
import { ar } from "@/lib/ui-ar"
import { verifyLogin } from "@/lib/users"

export type LoginState = { error?: string } | null

/**
 * Best-effort brute-force throttle (per Worker isolate). Add a Cloudflare WAF rate-limiting rule on
 * POST /login for a hard guarantee across isolates.
 */
const attempts = new Map<string, { count: number; first: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 8

function throttled(key: string, now: number): boolean {
  const a = attempts.get(key)
  if (!a || now - a.first > WINDOW_MS) return false
  return a.count >= MAX_FAILURES
}

function recordFailure(key: string, now: number) {
  const a = attempts.get(key)
  if (!a || now - a.first > WINDOW_MS) attempts.set(key, { count: 1, first: now })
  else a.count++
  if (attempts.size > 5000) attempts.clear()
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").slice(0, 200)
  const password = String(formData.get("password") ?? "").slice(0, 500)
  const ip = (await headers()).get("cf-connecting-ip") ?? "unknown"
  const keys = [`ip:${ip}`, `email:${email.trim().toLowerCase()}`]
  const now = Date.now()
  if (keys.some((k) => throttled(k, now))) return { error: ar.loginError }

  const user = await verifyLogin(email, password)
  if (!user) {
    for (const k of keys) recordFailure(k, now)
    return { error: ar.loginError }
  }

  const token = await createSessionToken(user.id, process.env.SESSION_SECRET)
  const c = await cookies()
  c.set(AUTH_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
  if (user.role === "admin") {
    redirect("/admin")
  }
  redirect("/user")
}

export async function logoutAction() {
  ;(await cookies()).delete(AUTH_SESSION_COOKIE)
  redirect("/login")
}
