"use client"

import { useRouter, usePathname } from "next/navigation"
import { useProfile } from "@/hooks/useProfile"
import { useTheme } from "@/hooks/useTheme"
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
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  FileCheck,
  LogOut,
  Moon,
  Sun,
  Shield,
  Building2,
  BadgeCheck,
  Send,
  FileText,
  Users,
  Settings,
  BarChart3,
  Clock,
  Archive,
  Bell,
  HelpCircle,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Logo from "../../public/Sealdrop.svg";
import Image from "next/image";

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { profile } = useProfile()
  const { theme, toggleTheme } = useTheme()

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
    {
      title: "My Deliveries",
      icon: FileText,
      path: "/deliveries",
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

  // Settings navigation items
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
      <SidebarHeader className="border-b border-sidebar-border p-4 space-y-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image src={Logo} alt="Sealdrop Logo" className="h-16 w-16" />
          <span className="text-lg font-bold">Sealdrop</span>
        </div>

        {/* Organization & Role */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium truncate">
              {profile?.organization?.name || "No organization"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <Badge
              variant={getRoleBadgeVariant(profile?.role)}
              className="text-xs"
            >
              {getRoleLabel(profile?.role)}
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
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
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
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
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
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
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">

          {/* User Info */}
          <div className="px-2 py-1 text-xs text-muted-foreground truncate">
            {profile?.email}
          </div>

          {/* Sign Out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        
      </SidebarFooter>
    </Sidebar>
  )
}
