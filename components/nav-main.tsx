"use client"

import { usePathname } from "next/navigation"
import { type Icon } from "@tabler/icons-react"
import Link from "next/link"
import { useState } from "react"
import { IconChevronRight } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export interface NavItem {
  title: string
  url?: string
  icon?: Icon
  roles?: string[]
  items?: NavItem[]
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set())

  const isActive = (url: string) => {
    if (url === "/dashboard-manager" && pathname === "/dashboard-manager") return true
    return pathname === url || pathname?.startsWith(url + "/")
  }

  const toggleMenu = (title: string) => {
    const next = new Set(openMenus)
    next.has(title) ? next.delete(title) : next.add(title)
    setOpenMenus(next)
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="gap-y-0.5">
          {items.map((item) => {
            const hasSubmenu = item.items && item.items.length > 0
            const active = item.url ? isActive(item.url) : false
            const isOpen = openMenus.has(item.title)

            return (
              <SidebarMenuItem key={item.title} className="relative">
                {hasSubmenu ? (
                  <>
                    <SidebarMenuButton
                      onClick={() => toggleMenu(item.title)}
                      tooltip={item.title}
                      className="cursor-pointer h-10 text-[13.5px] font-medium tracking-wide text-purple-100 hover:text-white hover:bg-white/[0.07] transition-colors duration-150 [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:text-purple-300 hover:[&_svg]:text-purple-200"
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <IconChevronRight
                        className={`ml-auto h-3.5 w-3.5 text-purple-400/40 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                      />
                    </SidebarMenuButton>
                    {isOpen && (
                      <SidebarMenuSub className="border-l border-purple-700/30 ml-3 gap-y-0.5">
                        {item.items!.map((subItem) => {
                          const subActive = isActive(subItem.url || "")
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                className={`h-9 text-[13px] tracking-wide transition-colors duration-150 [&_svg]:h-4 [&_svg]:w-4 ${
                                  subActive
                                    ? "bg-purple-500/20 text-white font-bold [&_svg]:text-purple-300"
                                    : "text-purple-100 font-medium hover:text-white hover:bg-white/[0.06] [&_svg]:text-purple-300"
                                }`}
                              >
                                <Link href={subItem.url || "#"}>
                                  {subItem.icon && <subItem.icon />}
                                  <span>{subItem.title}</span>
                                  {subActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0" />}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    )}
                  </>
                ) : (
                  <>
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-purple-400 rounded-r-full" />
                    )}
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={`h-10 text-[13.5px] tracking-wide transition-colors duration-150 [&_svg]:h-[18px] [&_svg]:w-[18px] ${
                        active
                          ? "bg-purple-500/20 text-white font-bold pl-4 [&_svg]:text-purple-300"
                          : "text-purple-100 font-medium hover:text-white hover:bg-white/[0.07] pl-3 [&_svg]:text-purple-300 hover:[&_svg]:text-purple-200"
                      }`}
                    >
                      <Link href={item.url || "#"}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
