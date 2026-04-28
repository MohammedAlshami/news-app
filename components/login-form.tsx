"use client"

import { useActionState } from "react"
import type { SVGProps } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction } from "@/lib/auth-actions"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="currentColor"
    viewBox="0 0 40 48"
    width="40"
    height="48"
    {...props}
  >
    <clipPath id="login-form-logo-clip">
      <path d="m0 0h40v48h-40z" />
    </clipPath>
    <g clipPath="url(#login-form-logo-clip)">
      <path d="m25.0887 5.05386-3.933-1.05386-3.3145 12.3696-2.9923-11.16736-3.9331 1.05386 3.233 12.0655-8.05262-8.0526-2.87919 2.8792 8.83271 8.8328-10.99975-2.9474-1.05385625 3.933 12.01860625 3.2204c-.1376-.5935-.2104-1.2119-.2104-1.8473 0-4.4976 3.646-8.1436 8.1437-8.1436 4.4976 0 8.1436 3.646 8.1436 8.1436 0 .6313-.0719 1.2459-.2078 1.8359l10.9227 2.9267 1.0538-3.933-12.0664-3.2332 11.0005-2.9476-1.0539-3.933-12.0659 3.233 8.0526-8.0526-2.8792-2.87916-8.7102 8.71026z" />
      <path d="m27.8723 26.2214c-.3372 1.4256-1.0491 2.7063-2.0259 3.7324l7.913 7.9131 2.8792-2.8792z" />
      <path d="m25.7665 30.0366c-.9886 1.0097-2.2379 1.7632-3.6389 2.1515l2.8794 10.746 3.933-1.0539z" />
      <path d="m21.9807 32.2274c-.65.1671-1.3313.2559-2.0334.2559-.7522 0-1.4806-.102-2.1721-.2929l-2.882 10.7558 3.933 1.0538z" />
      <path d="m17.6361 32.1507c-1.3796-.4076-2.6067-1.1707-3.5751-2.1833l-7.9325 7.9325 2.87919 2.8792z" />
      <path d="m13.9956 29.8973c-.9518-1.019-1.6451-2.2826-1.9751-3.6862l-10.95836 2.9363 1.05385 3.933z" />
    </g>
  </svg>
)

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null)

  return (
    <div className="w-full sm:max-w-md">
      <div className="flex items-center gap-1.5">
        <Logo
          className="h-7 w-7 text-foreground"
          aria-hidden
        />
        <p className="text-pretty text-lg font-medium text-foreground">
          {ar.newsBrand}
        </p>
      </div>
      <h1 className="text-balance mt-6 text-lg font-semibold text-foreground">
        {ar.loginTitle}
      </h1>
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
            dir="ltr"
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
            dir="ltr"
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
