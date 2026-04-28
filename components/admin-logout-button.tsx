import { Button } from "@/components/ui/button"
import { logoutAction } from "@/lib/auth-actions"
import { ar } from "@/lib/ui-ar"

export function AdminLogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" className="w-full" size="sm">
        {ar.adminLogout}
      </Button>
    </form>
  )
}
