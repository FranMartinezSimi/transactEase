"use client"

import { ReactNode, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@shared/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Separator } from "@shared/components/ui/separator"
import { LocationPermission } from "./LocationPermission"
import { useLocation } from "../hooks/useLocation"
import { createClient } from "@shared/lib/supabase/client"
import { getSubscriptionStatus } from "@shared/lib/subscription/guards"

interface AuthenticatedLayoutProps {
  children: ReactNode
}

interface SubscriptionStatus {
  isActive: boolean
  isLimitReached: boolean
  plan: string
  deliveriesUsed: number
  deliveriesLimit: number
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { hasPermission } = useLocation()
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check location permission on mount
    if (!hasPermission) {
      setShowLocationPrompt(true)
    }
  }, [hasPermission])

  useEffect(() => {
    checkSubscription()
  }, [])

  async function checkSubscription() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single()

      if (profile?.organization_id) {
        // Use centralized subscription status helper
        const status = await getSubscriptionStatus(
          supabase,
          profile.organization_id
        )

        if (status) {
          setSubscriptionStatus(status)
        }
      }
    } catch (error) {
      console.error("[AuthenticatedLayout] Error checking subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  // Rutas que pueden acceder incluso con suscripción inactiva/límite alcanzado
  const exemptPaths = ["/subscription", "/pricing", "/settings"]
  const isExempt = exemptPaths.some(path => pathname.startsWith(path))

  // Si no está exento y hay problemas de suscripción, redirigir
  useEffect(() => {
    if (!loading && !isExempt && subscriptionStatus) {
      if (!subscriptionStatus.isActive) {
        console.log("[AuthenticatedLayout] Inactive subscription, redirecting to /subscription")
        router.push("/subscription?status=inactive")
      } else if (subscriptionStatus.isLimitReached) {
        console.log("[AuthenticatedLayout] Delivery limit reached, redirecting to /pricing")
        router.push("/pricing?reason=limit_reached")
      }
    }
  }, [loading, subscriptionStatus, isExempt, pathname, router])

  const handlePermissionGranted = (position: GeolocationPosition) => {
    console.log("[AuthenticatedLayout] Location permission granted", {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    })
    setShowLocationPrompt(false)
  }

  const handlePermissionDenied = () => {
    console.log("[AuthenticatedLayout] Location permission denied, logging out")
    // Redirect to login or show error page
    router.push("/auth/login?error=location_required")
  }

  // Show loading spinner while checking subscription
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando suscripción...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {showLocationPrompt && (
        <LocationPermission
          onPermissionGranted={handlePermissionGranted}
          onPermissionDenied={handlePermissionDenied}
        />
      )}
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
