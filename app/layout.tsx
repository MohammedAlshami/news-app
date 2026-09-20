import type { Metadata } from "next"
import Script from "next/script"

import "./globals.css"
import { shubbak, neirizi } from "./fonts"
import { ThemeProvider } from "@/components/theme-provider"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"

export const metadata: Metadata = {
  title: ar.newsBrand,
  description: ar.homeMetaDescription,
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
        <Script
          src="//unpkg.com/react-grab/dist/index.global.js"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <ThemeProvider>
          <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
