import type { BlockAlign } from "./content-blocks"

const ALIGN: Record<NonNullable<BlockAlign>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
}

/**
 * Returns Tailwind alignment classes, or `undefined` when the block uses default (left) alignment.
 */
export function blockAlignClass(align?: BlockAlign) {
  if (!align || align === "left") {
    return undefined
  }
  return ALIGN[align]
}
