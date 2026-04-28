import { AdminLayoutShell } from "@/components/admin-layout-shell"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>
}
