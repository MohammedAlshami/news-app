"use client"

import { AdminLogoutButton } from "@/components/admin-logout-button"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  BookOpen,
  Database,
  DollarSign,
  Home,
  Images,
  Megaphone,
  Newspaper,
  PanelLeft,
  Radio,
  Sparkles,
  Tag,
  Users,
} from "lucide-react"
import Link from "next/link"
import type { Route } from "./nav-main"
import DashboardNavigation from "@/components/sidebar-03/nav-main"
const dashboardRoutes: Route[] = [
  {
    id: "home",
    title: ar.adminNavHome,
    icon: <Home className="size-4" />,
    link: "/admin",
  },
  {
    id: "admin-articles",
    title: ar.adminNavArticles,
    icon: <Newspaper className="size-4" />,
    link: "/admin/articles",
  },
  {
    id: "outputs-heading",
    title: "المخرجات",
    heading: true,
    link: "",
  },
  {
    id: "admin-scraped-articles",
    title: "المقالات المستخرجة",
    icon: <Database className="size-4" />,
    link: "/admin/scraped_articles",
  },
  {
    id: "admin-topics",
    title: "المواضيع",
    icon: <Tag className="size-4" />,
    link: "/admin/topics",
  },
  {
    id: "admin-generated-articles",
    title: "المقالات المولّدة",
    icon: <Sparkles className="size-4" />,
    link: "/admin/generated_articles",
  },
  {
    id: "admin-news-sources",
    title: "مصادر الأخبار",
    icon: <Radio className="size-4" />,
    link: "/admin/news-sources",
  },
  {
    id: "analytics-heading",
    title: "التحليلات",
    heading: true,
    link: "",
  },
  {
    id: "admin-finance",
    title: "المالية",
    icon: <DollarSign className="size-4" />,
    link: "/admin/finance",
  },
  {
    id: "admin-advertise",
    title: ar.adminNavAdvertise,
    icon: <Megaphone className="size-4" />,
    link: "/admin/advertise",
  },
  {
    id: "admin-site-ads",
    title: ar.adminNavSiteAds,
    icon: <Images className="size-4" />,
    link: "/admin/ads",
  },
  {
    id: "admin-users",
    title: "المستخدمون",
    icon: <Users className="size-4" />,
    link: "/admin/users",
    subs: [
      { title: ar.adminNavUsers, link: "/admin/users" },
      { title: ar.adminNavClients, link: "/admin/clients" },
    ],
  },
]

function AdminSidebarControls() {
  const { state, toggleSidebar, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <motion.div
      key={isCollapsed ? "header-collapsed" : "header-expanded"}
      className={cn(
        "flex items-center gap-2",
        isCollapsed ? "flex-row md:flex-col-reverse" : "flex-row",
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {!isMobile && (
        <Button
          type="button"
          data-sidebar="trigger"
          data-slot="sidebar-trigger"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={ar.adminToggleSidebar}
          className="[&>svg]:-scale-x-100"
        >
          <PanelLeft className="size-5" />
        </Button>
      )}
    </motion.div>
  )
}

export function DashboardSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar
      side="right"
      dir="rtl"
      variant="floating"
      collapsible="icon"
      mobileTitle={ar.adminSidebarLabel}
      mobileDescription={ar.adminSidebarDesc}
    >
      <SidebarHeader
        className={cn(
          "flex md:pt-3.5",
          isCollapsed
            ? "flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start"
            : "flex-row items-center justify-between",
        )}
      >
        <Link
          href="/"
          className="flex min-w-0 items-center text-foreground"
        >
          <Image
            src="/logo-light.svg"
            alt={ar.newsBrand}
            width={160}
            height={85}
            className={cn("h-12 w-auto", isCollapsed ? "h-10" : "h-12")}
            priority
          />
        </Link>

        <AdminSidebarControls />
      </SidebarHeader>
      <SidebarContent className="gap-4 px-2 py-4">
        <DashboardNavigation routes={dashboardRoutes} />
      </SidebarContent>
      <SidebarFooter className="space-y-2 px-2">
        <AdminLogoutButton />
      </SidebarFooter>
    </Sidebar>
  )
}
