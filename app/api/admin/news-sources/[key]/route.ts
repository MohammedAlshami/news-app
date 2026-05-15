import { NextResponse } from "next/server"

import { setNewsSourceEnabled } from "@/lib/db-news-sources.server"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params
  const body = await request.json().catch(() => null)

  if (typeof body?.isEnabled !== "boolean") {
    return NextResponse.json({ error: "isEnabled (boolean) required" }, { status: 400 })
  }

  await setNewsSourceEnabled(key, body.isEnabled)
  return NextResponse.json({ ok: true, key, isEnabled: body.isEnabled })
}
