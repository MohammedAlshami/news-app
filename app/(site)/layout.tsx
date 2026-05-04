import { AdPlaceholder } from "@/components/news-landing"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { ar } from "@/lib/ui-ar"
import { getHomeData } from "@/lib/db-home.server"
import Link from "next/link"

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { latestArticles } = await getHomeData()
  return (
    <div className="flex min-h-svh flex-col">
      <div className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-12 max-w-[1400px] items-center overflow-hidden px-4">
          <div className="relative z-10 flex h-full items-center whitespace-nowrap bg-red-600 px-5 text-sm font-bold text-white">
            أخبار بارزة
            <div className="absolute -left-4 top-0 bottom-0 w-4 origin-top bg-red-600 skew-x-[20deg]" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex animate-marquee items-center whitespace-nowrap">
              {[...latestArticles.slice(0, 4), ...latestArticles.slice(0, 4)].map((article, index) => (
                <div key={`${article.id}-${index}`} className="mx-8 flex items-center text-sm font-medium text-gray-700">
                  <Link href={`/news/${article.id}`} className="ml-4">
                    {article.title}
                  </Link>
                  <span className="text-gray-300">•</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
