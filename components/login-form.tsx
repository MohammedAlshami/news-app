"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction } from "@/lib/auth-actions"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null)

  return (
    <div className="w-full sm:max-w-md">
      <form className="mt-8 space-y-4" action={formAction}>
        {state?.error ? (
          <p
            className="text-sm text-destructive"
            role="status"
            aria-live="polite"
          >
            {state.error}
          </p>
        ) : null}
        <div>
          <Label htmlFor="email-login" className="text-sm font-medium">
            {ar.loginEmail}
          </Label>
          <Input
            type="email"
            id="email-login"
            name="email"
            autoComplete="email"
            required
            placeholder={ar.loginEmailPlaceholder}
            className="mt-2"
            dir="rtl"
          />
        </div>
        <div>
          <Label htmlFor="password-login" className="text-sm font-medium">
            {ar.loginPassword}
          </Label>
          <Input
            type="password"
            id="password-login"
            name="password"
            autoComplete="current-password"
            required
            placeholder={ar.loginPasswordPlaceholder}
            className="mt-2"
            dir="rtl"
          />
        </div>
        <Button
          type="submit"
          className={cn("mt-4 w-full py-2 font-medium")}
          disabled={pending}
        >
          {ar.loginSubmit}
        </Button>
      </form>
    </div>
  )
}
