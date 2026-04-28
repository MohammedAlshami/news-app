import { AdPlaceholder } from "@/components/news-landing"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { ar } from "@/lib/ui-ar"

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="container mx-auto px-4 py-4">
        <AdPlaceholder
          text={ar.adPlaceholderLeaderboard}
          className="h-24 w-full rounded-lg"
        />
      </div>
      <SiteHeader />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
      <SiteFooter />
    </div>
  )
}
