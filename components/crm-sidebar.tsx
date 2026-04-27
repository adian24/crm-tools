"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconUsers,
  IconTarget,
  IconTrendingUp,
  IconSettings,
  IconHelp,
  IconSearch,
  IconActivity,
  IconDatabase,
  IconChartBar,
  IconCalendar,
  IconKey,
  IconPhoto,
  IconPhone,
  IconFileText,
  IconSitemap,
  IconUsersGroup,
  IconHeartHandshake,
  IconStar,
  IconMessageCircle,
  IconAlertTriangle,
  IconNotes,
  IconAddressBook,
  IconShieldCheck,
  IconReport,
  IconChartPie,
  IconUserCheck,
  IconClipboardData,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import DashboardInfoDialog from "@/components/dashboard-info-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface CRMUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'staff';
  avatar?: string;
}

export interface CRMSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: CRMUser;
}

const getNavigationItems = (role: string) => {
  if (role === 'staff') {
    return [
      { title: "Jadwal Kunjungan",              url: "/dashboard-manager/dashboard-kunjungan",            icon: IconCalendar },
      { title: "Laporan Kunjungan",             url: "/dashboard-manager/laporan-kunjungan",              icon: IconReport },
      { title: "CRM Data Management",           url: "/dashboard-manager/crm-data",                       icon: IconTarget },
      { title: "Kontak",                        url: "/dashboard-manager/kontak",                         icon: IconAddressBook },
      { title: "Engagement & Partnership",      url: "/dashboard-manager/kunjungan-engagement-partnership", icon: IconHeartHandshake},
    ];
  }

  if (role === 'manager') {
    return [
      { title: "KPI",                           url: "/dashboard-manager/kpi",                            icon: IconTrendingUp },
      { title: "Struktur Divisi CRP",           url: "/dashboard-manager/struktur-divisi-crp",            icon: IconSitemap },
      { title: "Kolaborasi CRM",                url: "/dashboard-manager/kolaborasi-crm",                 icon: IconUsersGroup },
      { title: "Pencapaian CRM",                url: "/dashboard-manager/dashboard-data",                 icon: IconChartPie },
      { title: "Pencapaian PRM & Referral",     url: "/dashboard-manager/pencapaian-prm-referral",        icon: IconChartBar },
      { title: "Jadwal Kunjungan",              url: "/dashboard-manager/dashboard-kunjungan",            icon: IconCalendar },
      { title: "Laporan Kunjungan",             url: "/dashboard-manager/laporan-kunjungan",              icon: IconReport },
      { title: "Engagement & Partnership",      url: "/dashboard-manager/kunjungan-engagement-partnership", icon: IconHeartHandshake},
      { title: "NPS",                           url: "/dashboard-manager/nps",                            icon: IconStar },
      { title: "Flyer",                         url: "/dashboard-manager/flyer",                          icon: IconPhoto },
      { title: "Customer Complain",             url: "/dashboard-manager/customer-complain",              icon: IconMessageCircle },
      { title: "Isu & Kendala",                 url: "/dashboard-manager/isu-kendala",                    icon: IconAlertTriangle },
      { title: "Catatan Tambahan",              url: "/dashboard-manager/catatan-tambahan",               icon: IconNotes },
      { title: "CRM Data Management",           url: "/dashboard-manager/crm-data",                       icon: IconTarget },
      { title: "Data Historis 2024-2025",       url: "/dashboard-manager/monthly-input",                  icon: IconClipboardData },
      { title: "Kontak",                        url: "/dashboard-manager/kontak",                         icon: IconAddressBook },
      {
        title: "Master Data",
        icon: IconDatabase,
        items: [
          { title: "Data Associate", url: "/dashboard-manager/master-associate", icon: IconUserCheck },
        ],
      },
    ];
  }

  return [
    { title: "KPI",                           url: "/dashboard-manager/kpi",                            icon: IconTrendingUp },
    { title: "Struktur Divisi CRP",           url: "/dashboard-manager/struktur-divisi-crp",            icon: IconSitemap },
    { title: "Kolaborasi CRM",                url: "/dashboard-manager/kolaborasi-crm",                 icon: IconUsersGroup },
    { title: "Pencapaian CRM",                url: "/dashboard-manager/dashboard-data",                 icon: IconChartPie },
    { title: "Pencapaian PRM & Referral",     url: "/dashboard-manager/pencapaian-prm-referral",        icon: IconChartBar },
    { title: "Jadwal Kunjungan",              url: "/dashboard-manager/dashboard-kunjungan",            icon: IconCalendar },
    { title: "Laporan Kunjungan",             url: "/dashboard-manager/laporan-kunjungan",              icon: IconReport },
    { title: "Engagement & Partnership",      url: "/dashboard-manager/kunjungan-engagement-partnership", icon: IconHeartHandshake},
    { title: "NPS",                           url: "/dashboard-manager/nps",                            icon: IconStar },
    { title: "Flyer",                         url: "/dashboard-manager/flyer",                          icon: IconPhoto },
    { title: "Customer Complain",             url: "/dashboard-manager/customer-complain",              icon: IconMessageCircle },
    { title: "Isu & Kendala",                 url: "/dashboard-manager/isu-kendala",                    icon: IconAlertTriangle },
    { title: "Catatan Tambahan",              url: "/dashboard-manager/catatan-tambahan",               icon: IconNotes },
    { title: "CRM Data Management",           url: "/dashboard-manager/crm-data",                       icon: IconTarget },
    { title: "Data Historis 2024-2025",       url: "/dashboard-manager/monthly-input",                  icon: IconClipboardData },
    { title: "Kontak",                        url: "/dashboard-manager/kontak",                         icon: IconAddressBook },
    {
      title: "Master Data",
      icon: IconDatabase,
      items: [
        { title: "Data Associate", url: "/dashboard-manager/master-associate", icon: IconUserCheck },
      ],
    },
    {
      title: "Settings",
      icon: IconSettings,
      items: [
        { title: "Users",               url: "/dashboard-manager/settings/users",       icon: IconUsers },
        { title: "Roles & Permissions", url: "/dashboard-manager/settings/permissions", icon: IconShieldCheck },
      ],
    },
  ];
};

const getSecondaryItems = (role: string) => {
  const items: any[] = [];
  if (role === 'super_admin') {
    items.push({ title: "Get Help", url: "#", icon: IconHelp, action: "help" });
  } else {
    items.push(
      { title: "Get Help", url: "#", icon: IconHelp, action: "help" },
      { title: "Search", url: "#", icon: IconSearch },
    );
  }
  return items;
};

export function CRMSidebar({ user, ...props }: CRMSidebarProps) {
  const navItems = getNavigationItems(user.role);
  const secondaryItems = getSecondaryItems(user.role);
  const [helpDialogOpen, setHelpDialogOpen] = React.useState(false);

  const handleSecondaryItemClick = (item: any) => {
    if (item.action === 'help') setHelpDialogOpen(true);
  };

  return (
    <>
      <Sidebar
        {...props}
        collapsible="icon"
        variant="sidebar"
        className="relative overflow-hidden border-r border-purple-900/50"
        style={{
          fontFamily: "var(--font-jakarta, 'Plus Jakarta Sans', sans-serif)",
          "--sidebar-background": "#130a22",
          "--sidebar-foreground": "#e9d5ff",
          "--sidebar-accent": "rgba(124, 58, 237, 0.25)",
          "--sidebar-accent-foreground": "#ffffff",
          "--sidebar-border": "rgba(109, 40, 217, 0.3)",
          "--sidebar-ring": "#7c3aed",
          "--sidebar-primary": "#7c3aed",
          "--sidebar-primary-foreground": "#ffffff",
          "--sidebar-muted-foreground": "rgba(216, 180, 254, 0.5)",
        } as React.CSSProperties}
      >
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e0b3a] via-[#130a22] to-[#0d0718] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(139,92,246,0.12),transparent)] pointer-events-none" />

        {/* Header */}
        <SidebarHeader className="relative border-b border-purple-800/30 py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" className="hover:bg-white/5">
                <Link
                  href={user.role === 'staff' ? '/dashboard-manager/dashboard-kunjungan' : '/dashboard-manager/dashboard-data'}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 shadow-lg shadow-purple-900/60 flex-shrink-0 ring-1 ring-purple-400/20">
                    <IconActivity className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-white tracking-wide">CRM Tools</span>
                    <span className="text-[11.5px] text-purple-300/60 font-normal tracking-wide">Management System</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="relative py-4 gap-2">
          <NavMain items={navItems} />
          <NavSecondary items={secondaryItems} className="mt-auto" onItemClick={handleSecondaryItemClick} />
        </SidebarContent>

        <SidebarFooter className="relative border-t border-purple-800/30">
          <NavUser user={{ name: user.name, email: user.email, avatar: user.avatar || "" }} />
        </SidebarFooter>
      </Sidebar>

      <DashboardInfoDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} />
    </>
  );
}
