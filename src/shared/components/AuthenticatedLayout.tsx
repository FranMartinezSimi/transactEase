"use client"

import { ReactNode, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Separator } from "@/components/ui/separator"
import { LocationPermission } from "./LocationPermission"
import { useLocation } from "../hooks/useLocation"

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter()
  const { hasPermission, requestPermission } = useLocation()
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)

  useEffect(() => {
    // Check location permission on mount
    if (!hasPermission) {
      setShowLocationPrompt(true)
    }
  }, [hasPermission])

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
