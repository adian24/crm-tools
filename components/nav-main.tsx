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

export function NavMain({
  items,
}: {
  items: NavItem[]
}) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set())

  // Check if current path matches item URL
  const isActive = (url: string) => {
    if (url === "/dashboard-manager" && pathname === "/dashboard-manager") return true
    return pathname === url || pathname?.startsWith(url + "/")
  }

  const toggleMenu = (title: string) => {
    const newOpenMenus = new Set(openMenus)
    if (newOpenMenus.has(title)) {
      newOpenMenus.delete(title)
    } else {
      newOpenMenus.add(title)
    }
    setOpenMenus(newOpenMenus)
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const hasSubmenu = item.items && item.items.length > 0
            const active = item.url ? isActive(item.url) : false
            const isOpen = openMenus.has(item.title)

            return (
              <SidebarMenuItem key={item.title}>
                {hasSubmenu ? (
                  <>
                    <SidebarMenuButton
                      onClick={() => toggleMenu(item.title)}
                      tooltip={item.title}
                      className="cursor-pointer"
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <IconChevronRight
                        className={`ml-auto transition-transform duration-200 ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                    </SidebarMenuButton>
                    {isOpen && (
                      <SidebarMenuSub>
                        {item.items!.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={isActive(subItem.url || "") ? `
                                relative
                                bg-gradient-to-r from-blue-600 to-purple-600
                                hover:!from-blue-700 hover:!to-purple-700
                                text-white font-medium
                                shadow-md
                                before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent
                                before:opacity-0 hover:before:opacity-100
                                transition-all duration-200
                              ` : ""}
                            >
                              <Link href={subItem.url || "#"} className="relative z-10">
                                {subItem.icon && <subItem.icon className={isActive(subItem.url || "") ? "text-white" : ""} />}
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={active ? `
                      relative
                      bg-gradient-to-r from-blue-600 to-purple-600
                      hover:!from-blue-700 hover:!to-purple-700
                      text-white font-medium
                      shadow-md
                      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent
                      before:opacity-0 hover:before:opacity-100
                      transition-all duration-200
                    ` : ""}
                  >
                    <Link href={item.url || "#"} className="relative z-10">
                      {item.icon && <item.icon className={active ? "text-white" : ""} />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

