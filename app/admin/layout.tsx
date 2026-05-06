import { redirect } from "next/navigation"

import { AdminLayoutShell } from "@/components/admin-layout-shell"
import { getAuthSessionUserId } from "@/lib/auth-session.server"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const userId = await getAuthSessionUserId()
  if (!userId) {
    redirect("/login")
  }
  return <AdminLayoutShell>{children}</AdminLayoutShell>
}
