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
    <div className="flex-1 bg-[linear-gradient(180deg,#fff_0%,#fafafa_100%)]">
      <div dir="rtl" lang="ar" className="mx-auto w-full max-w-[90rem] px-4 py-12 sm:px-6 md:px-10 md:py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                {ar.loginMetaTitle}
              </span>
              <h1 className="mt-4 text-balance text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                {ar.loginTitle}
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-[15px] leading-7 text-slate-600 md:text-base">
                {ar.loginMetaDescription}
              </p>
              <div className="mt-8 grid gap-4 rounded-[1.75rem] bg-slate-950 p-5 text-white">
                <div>
                  <p className="text-sm font-medium text-slate-300">01</p>
                  <p className="mt-2 text-base font-bold">دخول سريع</p>
                  <p className="mt-1 text-sm leading-7 text-slate-300">
                    سجّل دخولك للوصول إلى لوحة الإدارة ومتابعة أدوات الموقع.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">02</p>
                  <p className="mt-2 text-base font-bold">حفظ الجلسة</p>
                  <p className="mt-1 text-sm leading-7 text-slate-300">
                    نحتفظ بجلسة العمل حتى تنتقل بين الصفحات بسلاسة.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8 lg:p-10">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
