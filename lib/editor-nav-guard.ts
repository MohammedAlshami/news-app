/** Pure helpers for the in-app navigation guard (App Router has no route-change events). */

export type ClickLike = {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  defaultPrevented: boolean
}

export type AnchorLike = {
  href: string
  target?: string | null
  hasDownload?: boolean
}

/**
 * Returns the in-app path (`pathname+search+hash`) when a click on `anchor` would navigate away
 * from the current page within this origin; otherwise null (new tab, hash-only, external, download).
 */
export function internalNavTarget(
  anchor: AnchorLike,
  click: ClickLike,
  currentHref: string,
): string | null {
  if (click.defaultPrevented || click.button !== 0) return null
  if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return null
  if (anchor.hasDownload) return null
  if (anchor.target && anchor.target !== "_self") return null
  let to: URL
  let from: URL
  try {
    from = new URL(currentHref)
    to = new URL(anchor.href, currentHref)
  } catch {
    return null
  }
  if (to.origin !== from.origin) return null
  if (to.pathname === from.pathname && to.search === from.search) return null
  return `${to.pathname}${to.search}${to.hash}`
}
