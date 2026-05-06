import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

const logoPath =
  "M12 2L2 7v2h20V7L12 2zm0 18c-4.41 0-8-3.59-8-8h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.41-3.59 8-8 8zm-7-9h2v4H5v-4zm4 0h2v4H9v-4zm4 0h2v4h-2v-4zm4 0h2v4h-2v-4z"

type SiteBrandMarkProps = {
  variant?: "onDark" | "onLight"
  /** Override text size (default differs by variant usage) */
  textClassName?: string
  className?: string
}

export function SiteBrandMark({
  variant = "onDark",
  textClassName,
  className,
}: SiteBrandMarkProps) {
  const isDark = variant === "onDark"
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 p-1",
          isDark ? "border-white" : "border-neutral-900",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className={cn("h-full w-full", isDark ? "fill-white" : "fill-neutral-900")}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path d={logoPath} />
        </svg>
      </div>
      <span
        className={cn(
          "font-serif tracking-tight",
          isDark ? "text-3xl text-white" : "text-2xl text-neutral-900 md:text-3xl",
          textClassName,
        )}
      >
        {ar.siteMark}
      </span>
    </div>
  )
}
