import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { LoginForm } from "@/components/login-form"
import { getAuthSessionUserId } from "@/lib/auth-session.server"
import { ar } from "@/lib/ui-ar"

export const metadata: Metadata = {
  title: ar.loginMetaTitle,
  description: ar.loginMetaDescription,
}

export default async function LoginPage() {
  const userId = await getAuthSessionUserId()
  if (userId) {
    redirect("/admin")
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <div className="mx-auto my-auto w-full min-w-0 max-w-md px-4 py-6 sm:px-6">
        <LoginForm />
      </div>
    </div>
  )
}
