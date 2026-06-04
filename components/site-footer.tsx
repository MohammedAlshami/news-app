import Image from "next/image"
import Link from "next/link"

import { ALL_CATEGORIES_ID } from "@/lib/site-routes"
import { getCategoryNavItems } from "@/lib/categories"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

function FooterLink({ label, href }: { label: string; href: string }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-white transition-colors duration-200 hover:text-white/80"
      >
        {label}
      </Link>
    </li>
  )
}

export async function SiteFooter() {
  const nav = await getCategoryNavItems()
  const allHref = nav.find((i) => i.id === ALL_CATEGORIES_ID)?.href ?? "/category/all"
  const year = new Date().getFullYear()

  return (
    <footer
      dir="rtl"
      lang="ar"
      className={cn(
        "w-full bg-[#151515] pb-20 pt-40 font-sans text-white",
        "selection:bg-gray-700",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24">
        {/*
          Mobile: single column.
          sm+: 2 columns — brand & address span full width; «الصفحات» و«الدعم» جنباً إلى جنب.
          lg+: 4 equal columns (Harbor-style row).
        */}
        <div
          className={cn(
            "mb-12 grid grid-cols-2 gap-8 sm:mb-16 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-12",
            "lg:grid-cols-3 lg:gap-x-10 lg:gap-y-10 xl:gap-x-12",
            "items-start",
          )}
        >
          {/* Brand */}
          <div className="space-y-5 sm:col-span-2 lg:col-span-1 col-span-2">
            <Image
              src="/logo-dark.svg"
              alt={ar.newsBrand}
              width={140}
              height={74}
              className="h-32 w-auto"
            />

            <p className="max-w-xl text-sm leading-relaxed text-white sm:max-w-2xl lg:max-w-xs">
              {ar.footerBlurbDark}
            </p>
          </div>

          {/* Pages */}
          <div className="min-w-0">
            <h3 className="mb-4 text-lg font-medium text-white sm:mb-6 sm:text-xl">
              {ar.footerColPages}
            </h3>
            <ul className="space-y-3 sm:space-y-4">
              <FooterLink label={ar.home} href="/" />
              <FooterLink label={ar.footerAboutWho} href="#" />
              <FooterLink label={ar.footerLinkEvents} href={allHref} />
              <FooterLink label={ar.footerLinkCurrency} href="/tools/currency-converter" />
            </ul>
          </div>

          {/* Support */}
          <div className="min-w-0">
            <h3 className="mb-4 text-lg font-medium text-white sm:mb-6 sm:text-xl">
              {ar.footerColSupport}
            </h3>
            <ul className="space-y-3 sm:space-y-4">
              <FooterLink label={ar.footerContact} href="/advertise" />
              <FooterLink label={ar.footerPrivacy} href="#" />
              <FooterLink label={ar.footerTerms} href="#" />
            </ul>
          </div>


        </div>

        <div className="flex flex-col items-center border-t border-white/10 px-1 pt-8 sm:px-0">
          <p className="max-w-prose text-center text-xs leading-relaxed text-white sm:text-sm">
            {ar.footerCopyrightNote(year)}
          </p>
        </div>
      </div>
    </footer>
  )
}
