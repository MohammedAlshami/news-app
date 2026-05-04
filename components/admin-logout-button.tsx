import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { logoutAction } from "@/lib/auth-actions"
import { ar } from "@/lib/ui-ar"

export function AdminLogoutButton() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        variant="outline"
        className={isCollapsed ? "w-10 justify-center gap-0 px-0" : "w-full"}
        size="sm"
        aria-label={ar.adminLogout}
        title={ar.adminLogout}
      >
        <LogOut className="size-4" />
        {!isCollapsed ? <span>{ar.adminLogout}</span> : null}
      </Button>
    </form>
  )
}
