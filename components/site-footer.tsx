import Link from "next/link"

import { SiteNewsletterForm } from "@/components/site-newsletter-form"
import { getCategoryNavItems } from "@/lib/categories"
import { ALL_CATEGORIES_ID } from "@/lib/site-routes"
import { ar } from "@/lib/ui-ar"

export async function SiteFooter() {
  const nav = await getCategoryNavItems()
  const sectionLinks = nav.filter((i) => i.id !== ALL_CATEGORIES_ID).slice(0, 6)
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-gray-50 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link
              href="/"
              className="mb-6 block text-2xl font-bold tracking-tighter text-black"
            >
              {ar.siteMark}
              <span className="text-red-600">.</span>
            </Link>
            <p className="mb-6 text-sm leading-relaxed text-gray-500">
              {ar.siteFooterBlurb}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-black"
              >
                {ar.footerSocialTwitter}
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-black"
              >
                {ar.footerSocialFacebook}
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-black"
              >
                {ar.footerSocialInstagram}
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-6 font-bold">{ar.footerColSections}</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              {sectionLinks.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="transition-colors hover:text-black">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={nav.find((i) => i.id === ALL_CATEGORIES_ID)?.href ?? "/category/all"}
                  className="transition-colors hover:text-black"
                >
                  {ar.all}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-bold">{ar.footerColAbout}</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li>
                <Link href="#" className="transition-colors hover:text-black">
                  {ar.footerAboutWho}
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-black">
                  {ar.footerPrivacy}
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-black">
                  {ar.footerTerms}
                </Link>
              </li>
              <li>
                <Link href="/advertise" className="transition-colors hover:text-black">
                  {ar.footerContact}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-bold">{ar.footerNewsletterTitle}</h4>
            <p className="mb-4 text-sm text-gray-500">{ar.footerNewsletterDesc}</p>
            <SiteNewsletterForm />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 text-center text-xs text-gray-400">
          {ar.footerCopyrightNote(year)}
        </div>
      </div>
    </footer>
  )
}
