"use client"

import { useState } from "react"
import { Bell, Crown, CreditCard, Globe, LogOut, Settings, User, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { logoutAction } from "@/lib/auth-actions"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

type Tab = "profile" | "subscription" | "preferences"

const tabs: { key: Tab; label: string; icon: typeof User }[] = [
  { key: "profile", label: "الملف الشخصي", icon: User },
  { key: "subscription", label: "الاشتراك", icon: Crown },
  { key: "preferences", label: "التفضيلات", icon: Settings },
]

export function UserDashboardClient({ email, siteMark }: { email: string; siteMark: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      <div className="shrink-0 lg:w-56">
        <h1 className="text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
          {siteMark}
        </h1>
        <div className="mt-4 flex gap-1 overflow-x-auto lg:mt-6 lg:flex-col lg:gap-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors lg:px-5 lg:py-3",
                activeTab === key
                  ? "bg-black text-white"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">الملف الشخصي</h2>
              <p className="mt-1 text-sm text-slate-500">معلومات حسابك الأساسية</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">{ar.loginEmail}</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">حالة الحساب</p>
                  <p className="mt-1 text-base font-semibold text-green-600">نشط</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "subscription" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">الاشتراك</h2>
              <p className="mt-1 text-sm text-slate-500">إدارة خطتك وباقتك</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">الباقة الشهرية</p>
                  <p className="text-sm text-slate-500">٩٫٩٩ دولار / شهرياً</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-700">اشتراكك نشط حتى ٣٠ يونيو ٢٠٢٦</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">وسيلة الدفع</h3>
              <p className="mt-1 text-sm text-slate-500">بطاقتك الافتراضية</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <CreditCard className="h-6 w-6 text-slate-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">•••• •••• •••• ٤٢٤٢</p>
                  <p className="text-sm text-slate-500">تنتهي في ١٢/٢٧</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                <div>
                  <p className="font-bold text-slate-900">إلغاء الاشتراك</p>
                  <p className="mt-1 text-sm text-slate-500">
                    عند الإلغاء ستفقد الوصول إلى المحتوى الحصري في نهاية فترة الفوترة الحالية.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 border-slate-300 text-slate-700 hover:bg-slate-100"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    إلغاء الاشتراك
                  </Button>
                </div>
              </div>
            </div>

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>تأكيد الإلغاء</DialogTitle>
                  <DialogDescription>
                    هل أنت متأكد من إلغاء اشتراكك؟ ستفقد الوصول إلى المحتوى الحصري في نهاية فترة الفوترة الحالية.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                    تراجع
                  </Button>
                  <Button
                    onClick={() => setCancelDialogOpen(false)}
                  >
                    تأكيد الإلغاء
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">التفضيلات</h2>
              <p className="mt-1 text-sm text-slate-500">تخصيص تجربتك</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900">إشعارات البريد الإلكتروني</p>
                      <p className="text-sm text-slate-500">استلام آخر الأخبار على بريدك</p>
                    </div>
                  </div>
                  <div className="h-6 w-11 rounded-full bg-black" role="switch" aria-checked="true" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900">اللغة</p>
                      <p className="text-sm text-slate-500">لغة الواجهة</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900">العربية</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <form action={logoutAction} className="mt-8">
          <Button type="submit" variant="outline" className="w-full gap-2">
            <LogOut className="h-4 w-4" aria-hidden />
            {ar.login}
          </Button>
        </form>
      </div>
    </div>
  )
}
