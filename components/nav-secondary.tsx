"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"
import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  onItemClick,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
    roles?: string[]
    action?: string
  }[]
  onItemClick?: (item: any) => void
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.url === "#" ? (
                <SidebarMenuButton
                  onClick={() => onItemClick?.(item)}
                  className="cursor-pointer h-9 text-[13px] font-medium tracking-wide text-purple-300/50 hover:text-purple-200 hover:bg-white/[0.05] transition-colors duration-150 [&_svg]:h-[17px] [&_svg]:w-[17px] [&_svg]:text-purple-400/40 hover:[&_svg]:text-purple-300/70"
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  asChild
                  className="h-9 text-[13px] font-medium tracking-wide text-purple-300/50 hover:text-purple-200 hover:bg-white/[0.05] transition-colors duration-150 [&_svg]:h-[17px] [&_svg]:w-[17px] [&_svg]:text-purple-400/40 hover:[&_svg]:text-purple-300/70"
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
