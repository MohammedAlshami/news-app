import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { AUTH_SESSION_COOKIE } from "./lib/auth"

/** Edge runtime required for OpenNext on Cloudflare Workers (Node middleware unsupported). */
export const runtime = "experimental-edge"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const hasSession = Boolean(
    request.cookies.get(AUTH_SESSION_COOKIE)?.value,
  )

  if (path.startsWith("/admin") && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (path === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
}
