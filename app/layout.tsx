import type { Metadata } from "next"
import { Tajawal } from "next/font/google"
import Script from "next/script"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"

const fontArabic = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
})

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
      className={cn(fontArabic.variable, "font-sans antialiased")}
    >
      <body className="min-h-svh">
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        <ThemeProvider>
          <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
