import Link from "next/link"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

type StoryCardProps = {
  title: string
  excerpt: string
  image: string
  category: string
  href?: string
  className?: string
}

export function StoryCard({
  title,
  excerpt,
  image,
  category,
  href = "#",
  className,
}: StoryCardProps) {
  return (
    <Link href={href} className={cn("group cursor-pointer", className)}>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-100">
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <span className="mt-4 block text-xs font-bold uppercase tracking-wider text-red-600">
        {category}
      </span>
      <h3 className="mt-2 text-lg font-bold leading-snug transition group-hover:text-red-600">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-gray-500">{excerpt}</p>
    </Link>
  )
}

type StoryListItemProps = {
  title: string
  category: string
  image: string
  href?: string
  time: string
  compact?: boolean
}

export function StoryListItem({
  title,
  category,
  image,
  href = "#",
  time,
  compact = false,
}: StoryListItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex cursor-pointer gap-4",
        !compact && "border-t pt-6",
      )}
    >
      <img
        src={image}
        alt={title}
        className="h-24 w-24 shrink-0 rounded-lg object-cover"
      />
      <div>
        <span className="text-xs font-bold text-red-600">{category}</span>
        <h3 className="text-lg font-bold leading-snug transition group-hover:text-red-600">
          {title}
        </h3>
        <span className="text-xs text-gray-400">{time}</span>
      </div>
    </Link>
  )
}

type SectionHeaderProps = {
  title: string
  accentClassName?: string
  href?: string
}

export function SectionHeader({
  title,
  accentClassName,
  href = "#",
}: SectionHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <span className={cn("h-8 w-2", accentClassName ?? "bg-black")} />
        {title}
      </h2>
      <Link href={href} className="text-sm text-gray-500 hover:text-black">
        عرض الكل ←
      </Link>
    </div>
  )
}

export function AdPlaceholder({ text, className }: { text: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-100 text-sm text-gray-400",
        className,
      )}
    >
      {text}
    </div>
  )
}

export function TopToolbar() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" className="rounded-full">
        <Search className="size-5" />
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full md:hidden">
        <span className="sr-only">{ar.adminToggleSidebar}</span>
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </Button>
    </div>
  )
}
