import type { Metadata } from "next"

import "./globals.css"
import { shubbak, neirizi } from "./fonts"
import { ThemeProvider } from "@/components/theme-provider"
import { HOME_DESCRIPTION, HOME_TITLE, RSS_PATH, SITE_LOCALE, SITE_NAME, siteUrl } from "@/lib/seo"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"

// Function form: SITE_URL is read per request, so the Worker var applies (not frozen at build time).
export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: HOME_TITLE, template: `%s | ${SITE_NAME}` },
    description: HOME_DESCRIPTION,
    applicationName: SITE_NAME,
    alternates: { types: { "application/rss+xml": RSS_PATH } },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
    },
    twitter: { card: "summary_large_image" },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={cn(shubbak.variable, neirizi.variable, "font-sans antialiased")}
    >
      <body className="min-h-svh">
        <ThemeProvider>
          <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
