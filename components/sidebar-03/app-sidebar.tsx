"use client"

import { AdminLogoutButton } from "@/components/admin-logout-button"
import { Button } from "@/components/ui/button"
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
  Activity,
  DollarSign,
  Home,
  Images,
  Infinity,
  LinkIcon,
  Megaphone,
  Newspaper,
  Package2,
  Percent,
  PieChart,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  PanelLeft,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/sidebar-03/logo"
import type { Route } from "./nav-main"
import DashboardNavigation from "@/components/sidebar-03/nav-main"
import { NotificationsPopover } from "@/components/sidebar-03/nav-notifications"
import { TeamSwitcher } from "@/components/sidebar-03/team-switcher"

const sampleNotifications = [
  {
    id: "1",
    avatar: "",
    fallback: "أ",
    text: "مثال: لا توجد بيانات حقيقية هنا حتى الآن.",
    time: "الآن",
  },
]

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
    id: "products",
    title: ar.adminNavProducts,
    icon: <Package2 className="size-4" />,
    link: "#",
    subs: [
      { title: ar.adminNavCatalog, link: "#", icon: <Package2 className="size-4" /> },
      { title: ar.adminNavCheckoutLinks, link: "#", icon: <LinkIcon className="size-4" /> },
      { title: ar.adminNavDiscounts, link: "#", icon: <Percent className="size-4" /> },
    ],
  },
  {
    id: "usage-billing",
    title: ar.adminNavUsageBilling,
    icon: <PieChart className="size-4" />,
    link: "#",
    subs: [
      { title: ar.adminNavMeters, link: "#", icon: <PieChart className="size-4" /> },
      { title: ar.adminNavEvents, link: "#", icon: <Activity className="size-4" /> },
    ],
  },
  {
    id: "benefits",
    title: ar.adminNavBenefits,
    icon: <Sparkles className="size-4" />,
    link: "#",
  },
  {
    id: "customers",
    title: ar.adminNavCustomers,
    icon: <Users className="size-4" />,
    link: "#",
  },
  {
    id: "sales",
    title: ar.adminNavSales,
    icon: <ShoppingBag className="size-4" />,
    link: "#",
    subs: [
      { title: ar.adminNavOrders, link: "#", icon: <ShoppingBag className="size-4" /> },
      { title: ar.adminNavSubscriptions, link: "#", icon: <Infinity className="size-4" /> },
    ],
  },
  {
    id: "storefront",
    title: ar.adminNavStorefront,
    icon: <Store className="size-4" />,
    link: "#",
  },
  {
    id: "analytics",
    title: ar.adminNavAnalytics,
    icon: <TrendingUp className="size-4" />,
    link: "#",
  },
  {
    id: "finance",
    title: ar.adminNavFinance,
    icon: <DollarSign className="size-4" />,
    link: "#",
    subs: [
      { title: ar.adminNavIncoming, link: "#" },
      { title: ar.adminNavOutgoing, link: "#" },
      { title: ar.adminNavPayout, link: "#" },
    ],
  },
  {
    id: "settings",
    title: ar.adminNavSettings,
    icon: <Settings className="size-4" />,
    link: "#",
    subs: [
      { title: ar.adminNavGeneral, link: "#" },
      { title: ar.adminNavWebhooks, link: "#" },
      { title: ar.adminNavCustomFields, link: "#" },
    ],
  },
]

const teams = [{ name: ar.newsBrand, logo: Logo, plan: ar.adminPanel }]

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
      <NotificationsPopover notifications={sampleNotifications} />
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
          className="flex min-w-0 items-center gap-2 text-foreground"
        >
          <Logo className="h-8 w-8 shrink-0" />
          {!isCollapsed && (
            <span className="min-w-0 truncate font-semibold text-foreground">
              {ar.newsBrand}
            </span>
          )}
        </Link>

        <AdminSidebarControls />
      </SidebarHeader>
      <SidebarContent className="gap-4 px-2 py-4">
        <DashboardNavigation routes={dashboardRoutes} />
      </SidebarContent>
      <SidebarFooter className="space-y-2 px-2">
        <AdminLogoutButton />
        <TeamSwitcher teams={teams} />
      </SidebarFooter>
    </Sidebar>
  )
}
