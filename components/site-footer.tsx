import Link from "next/link"
import type { ReactNode } from "react"
import { MapPin, Send } from "lucide-react"

import { ALL_CATEGORIES_ID } from "@/lib/site-routes"
import { getCategoryNavItems } from "@/lib/categories"
import { SiteBrandMark } from "@/components/site-brand-mark"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function IconLinkedin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function FooterLink({ label, href }: { label: string; href: string }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-gray-400 transition-colors duration-200 hover:text-white"
      >
        {label}
      </Link>
    </li>
  )
}

function SocialIcon({
  href,
  ariaLabel,
  children,
}: {
  href: string
  ariaLabel: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 text-gray-400 transition-all duration-300 hover:border-white hover:bg-white hover:text-[#151515]"
    >
      {children}
    </a>
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
        "w-full bg-[#151515] px-4 py-12 font-sans text-white sm:px-6 sm:py-14 md:px-10 lg:px-16 xl:px-24 lg:py-16",
        "selection:bg-gray-700",
      )}
    >
      <div className="mx-auto max-w-7xl">
        {/*
          Mobile: single column.
          sm+: 2 columns — brand & address span full width; «الصفحات» و«الدعم» جنباً إلى جنب.
          lg+: 4 equal columns (Harbor-style row).
        */}
        <div
          className={cn(
            "mb-12 grid grid-cols-1 gap-10 sm:mb-16 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12",
            "lg:grid-cols-4 lg:gap-x-10 lg:gap-y-10 xl:gap-x-12",
            "items-start",
          )}
        >
          {/* Brand */}
          <div className="space-y-5 sm:col-span-2 lg:col-span-1">
            <SiteBrandMark variant="onDark" />

            <p className="max-w-xl text-sm leading-relaxed text-gray-400 sm:max-w-2xl lg:max-w-xs">
              {ar.footerBlurbDark}
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <SocialIcon href="#" ariaLabel={ar.footerSocialTelegramAria}>
                <Send size={18} aria-hidden />
              </SocialIcon>
              <SocialIcon href="https://facebook.com" ariaLabel={ar.footerSocialFacebook}>
                <IconFacebook className="h-[18px] w-[18px]" />
              </SocialIcon>
              <SocialIcon href="https://linkedin.com" ariaLabel={ar.footerSocialLinkedinAria}>
                <IconLinkedin className="h-[18px] w-[18px]" />
              </SocialIcon>
            </div>
          </div>

          {/* Pages */}
          <div className="min-w-0">
            <h3 className="mb-4 text-lg font-medium text-gray-200 sm:mb-6 sm:text-xl">
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
            <h3 className="mb-4 text-lg font-medium text-gray-200 sm:mb-6 sm:text-xl">
              {ar.footerColSupport}
            </h3>
            <ul className="space-y-3 sm:space-y-4">
              <FooterLink label={ar.footerContact} href="/advertise" />
              <FooterLink label={ar.footerPrivacy} href="#" />
              <FooterLink label={ar.footerTerms} href="#" />
            </ul>
          </div>

          {/* Address */}
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <h3 className="mb-4 text-lg font-medium text-gray-200 sm:mb-6 sm:text-xl">
              {ar.footerColAddress}
            </h3>
            <div className="mb-5 space-y-2 text-sm leading-relaxed text-gray-400 sm:mb-6">
              <p>{ar.footerAddressLine1}</p>
              <p>{ar.footerAddressLine2}</p>
              <p>{ar.footerAddressLine3}</p>
            </div>
            <a
              href="https://maps.google.com/?q=Wasilla+AK+99654"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-medium text-white transition-colors duration-200 hover:text-gray-300"
            >
              <MapPin size={20} className="shrink-0" aria-hidden />
              <span>{ar.footerSeeOnMap}</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center border-t border-gray-800 px-1 pt-8 sm:px-0">
          <p className="max-w-prose text-center text-xs leading-relaxed text-gray-500 sm:text-sm">
            {ar.footerCopyrightNote(year)}
          </p>
        </div>
      </div>
    </footer>
  )
}
