import { NextResponse } from "next/server"

import { requireAdminApi } from "@/lib/admin-guard.server"

import { setNewsSourceEnabled } from "@/lib/db-news-sources.server"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const denied = await requireAdminApi()
  if (denied) return denied
  const { key } = await params
  const body = await request.json().catch(() => null)

  if (typeof body?.isEnabled !== "boolean") {
    return NextResponse.json({ error: "isEnabled (boolean) required" }, { status: 400 })
  }

  if (!/^[\w.-]{1,64}$/.test(key)) {
    return NextResponse.json({ error: "invalid key" }, { status: 400 })
  }

  await setNewsSourceEnabled(key, body.isEnabled)
  return NextResponse.json({ ok: true, key, isEnabled: body.isEnabled })
}
