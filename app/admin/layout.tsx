import { redirect } from "next/navigation"

import { AdminLayoutShell } from "@/components/admin-layout-shell"
import { getAuthSessionUserId } from "@/lib/auth-session.server"
import { getUserById } from "@/lib/users"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const userId = await getAuthSessionUserId()
  if (!userId) {
    redirect("/login")
  }
  const user = getUserById(userId)
  if (!user || user.role !== "admin") {
    redirect("/user")
  }
  return <AdminLayoutShell>{children}</AdminLayoutShell>
}
