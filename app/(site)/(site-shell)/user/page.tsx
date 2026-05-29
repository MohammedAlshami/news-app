import { redirect } from "next/navigation"

import { UserDashboardClient } from "@/components/user-dashboard-client"
import { getAuthSessionUserId } from "@/lib/auth-session.server"
import { getUserById } from "@/lib/users"
import { ar } from "@/lib/ui-ar"

export default async function UserDashboardPage() {
  const userId = await getAuthSessionUserId()
  if (!userId) {
    redirect("/login")
  }
  const user = getUserById(userId)
  if (!user) {
    redirect("/login")
  }

  return (
    <div dir="rtl" lang="ar" className="mx-auto w-full max-w-[90rem] px-4 pb-24 pt-6 sm:px-6 md:px-10 md:pb-28 md:pt-10">
      <div className="mx-auto max-w-4xl">
        <UserDashboardClient email={user.email} siteMark={ar.siteMark} />
      </div>
    </div>
  )
}
