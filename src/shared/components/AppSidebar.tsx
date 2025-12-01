"use client"

import { useRouter, usePathname } from "next/navigation"
import { useProfile } from "@features/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@shared/components/ui/sidebar"
import {
  LayoutDashboard,
  FileCheck,
  LogOut,
  Building2,
  BadgeCheck,
  Send,
  Users,
  Settings,
  HelpCircle,
  CreditCard,
} from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Badge } from "@shared/components/ui/badge"
import { toast } from "sonner"
import Logo from "../../../public/Sealdrop.svg";
import Image from "next/image";

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { profile } = useProfile()

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "owner":
        return "default"
      case "admin":
        return "default"
      case "member":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "owner":
        return "Owner"
      case "admin":
        return "Admin"
      case "member":
        return "Member"
      default:
        return "User"
    }
  }

  const isActive = (path: string) => pathname === path

  const isAdmin = profile?.role === "admin" || profile?.role === "owner"
  const isOwner = profile?.role === "owner"

  // Main navigation items
  const mainNavItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      title: "Send Delivery",
      icon: Send,
      path: "/delivery",
    },
  ]

  // Admin-only navigation items
  const adminNavItems = [
    {
      title: "Audit Log",
      icon: FileCheck,
      path: "/audit",
    },
    {
      title: "Team Members",
      icon: Users,
      path: "/settings/users",
    },
    {
      title: "Organization",
      icon: Building2,
      path: "/settings/organization",
    },
  ]

  // Settings navigation items (all users)
  const settingsNavItems = [
    {
      title: "Settings",
      icon: Settings,
      path: "/settings",
    },
    {
      title: "Help & Support",
      icon: HelpCircle,
      path: "/help",
    },
  ]

  // Owner-only settings items
  const ownerSettingsNavItems = [
    {
      title: "Subscription",
      icon: CreditCard,
      path: "/subscription",
    },
  ]

  // Upgrade/Pricing link (for non-enterprise users)
  const upgradePath = {
    title: "Upgrade",
    icon: CreditCard,
    path: "/pricing",
  }

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Signed out successfully")
        router.push("/auth/login")
      } else {
        toast.error("Failed to sign out")
      }
    } catch (error) {
      console.error("[Sidebar] Sign out error:", error)
      toast.error("An error occurred")
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4 space-y-3 overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <Image src={Logo} alt="Sealdrop Logo" className="h-16 w-16 flex-shrink-0" />
          <span className="text-lg font-bold truncate">Sealdrop</span>
        </div>

        {/* Organization & Role */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate min-w-0">
              {profile?.organization?.name || "No organization"}
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <Badge
              variant={getRoleBadgeVariant(profile?.role)}
              className="text-xs truncate"
            >
              {getRoleLabel(profile?.role)}
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive(item.path)}
                    onClick={() => router.push(item.path)}
                    className="min-w-0"
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation - Only visible to admins */}
        {isAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive(item.path)}
                        onClick={() => router.push(item.path)}
                        className="min-w-0"
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Settings Navigation */}
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive(item.path)}
                    onClick={() => router.push(item.path)}
                    className="min-w-0"
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Owner-only settings */}
              {isOwner && ownerSettingsNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive(item.path)}
                    onClick={() => router.push(item.path)}
                    className="min-w-0"
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 overflow-hidden">

        {/* User Info */}
        <div className="px-2 py-1 text-xs text-muted-foreground truncate min-w-0 overflow-hidden">
          {profile?.email}
        </div>

        {/* Sign Out */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 min-w-0"
        >
          <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">Sign Out</span>
        </Button>

      </SidebarFooter>
    </Sidebar>
  )
}
