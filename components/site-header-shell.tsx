"use client"

import Link from "next/link"
import { Menu, Search } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

export type SiteHeaderNavItem = {
  href: string
  label: string
}

type Props = {
  items: SiteHeaderNavItem[]
  browseHref: string
}

export function SiteHeaderShell({ items, browseHref }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md transition-shadow",
        scrolled && "shadow-sm",
      )}
      aria-label="رئيسي"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tighter text-black"
          >
            {ar.siteMark}
            <span className="text-red-600">.</span>
          </Link>

          <div className="hidden items-center gap-8 font-medium text-gray-600 md:flex">
            {items.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="transition-colors hover:text-black"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href={browseHref}
              className="rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100"
              aria-label={ar.siteNavSearchAria}
            >
              <Search className="size-5" aria-hidden />
            </Link>
            <Link
              href="/login"
              className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-black md:inline"
            >
              {ar.login}
            </Link>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label={ar.siteNavMenuOpen}
                >
                  <Menu className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100%,20rem)]">
                <SheetHeader>
                  <SheetTitle>{ar.siteNavMenuTitle}</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1">
                  {items.map((item) => (
                    <SheetClose key={`${item.href}-${item.label}`} asChild>
                      <Link
                        href={item.href}
                        className="rounded-lg px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link
                      href={browseHref}
                      className="rounded-lg px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {ar.all}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/advertise"
                      className="rounded-lg px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {ar.footerAdvertise}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/login"
                      className="rounded-lg px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {ar.login}
                    </Link>
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
