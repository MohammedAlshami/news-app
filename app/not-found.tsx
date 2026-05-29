import Link from "next/link"

import { ar } from "@/lib/ui-ar"

export default function NotFound() {
  return (
    <div
      dir="rtl"
      lang="ar"
      className="flex min-h-svh flex-col items-center justify-center bg-white px-4 text-center"
    >
      <p className="text-[10rem] font-black leading-none tracking-tighter text-slate-200 md:text-[14rem]">
        404
      </p>
      <h1 className="-mt-6 text-2xl font-bold text-slate-900 md:text-3xl">
        الصفحة غير موجودة
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-500">
        عذراً، الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها. تحقق من الرابط أو عد إلى الرئيسية.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-8 py-3 text-sm font-bold text-white transition-opacity hover:opacity-80"
      >
        {ar.home}
      </Link>
    </div>
  )
}
