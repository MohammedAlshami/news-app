import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { LoginForm } from "@/components/login-form"
import { getAuthSessionUserId } from "@/lib/auth-session.server"
import { getUserById } from "@/lib/users"
import { ar } from "@/lib/ui-ar"

export const metadata: Metadata = {
  title: ar.loginMetaTitle,
  description: ar.loginMetaDescription,
}

export default async function LoginPage() {
  const userId = await getAuthSessionUserId()
  if (userId) {
    const user = getUserById(userId)
    if (user?.role === "admin") {
      redirect("/admin")
    }
    redirect("/user")
  }

  return (
    <div className="flex-1 bg-[linear-gradient(180deg,#fff_0%,#fafafa_100%)]">
      <div dir="rtl" lang="ar" className="mx-auto w-full max-w-[90rem] px-4 py-12 sm:px-6 md:px-10 md:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-md">
          <div className="text-center">
            <h1 className="text-balance text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
              {ar.loginTitle}
            </h1>
            <p className="mt-3 text-pretty text-[15px] leading-7 text-slate-600 md:text-base">
              {ar.loginMetaDescription}
            </p>
          </div>
          <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8 lg:p-10">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
