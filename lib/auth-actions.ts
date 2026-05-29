"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AUTH_SESSION_COOKIE } from "@/lib/auth"
import { findUserByEmailAndPassword } from "@/lib/users"
import { ar } from "@/lib/ui-ar"

export type LoginState = { error?: string } | null

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const user = findUserByEmailAndPassword(email, password)
  if (!user) {
    return { error: ar.loginError }
  }
  const c = await cookies()
  c.set(AUTH_SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  if (user.role === "admin") {
    redirect("/admin")
  }
  redirect("/user")
}

export async function logoutAction() {
  (await cookies()).delete(AUTH_SESSION_COOKIE)
  redirect("/login")
}
