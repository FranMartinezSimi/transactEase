"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@shared/lib/supabase/client"
import { AuthenticatedLayout } from "@shared/components/AuthenticatedLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card"
import { FileText, Eye, Download, Users, Loader2 } from "lucide-react"
import { Badge } from "@shared/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { useProfile } from "@features/auth"
import { useDeliveries } from "@features/delivery/hooks/useDeliveries"
import { DeliveryActions } from "@features/delivery/components/DeliveryActions"
import { DeliveryStats } from "@features/delivery/types/delivery.interface"
import { toast } from "sonner"

export default function DashboardPage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const { profile, loading: profileLoading } = useProfile()
  const isAdmin = profile?.role === "admin" || profile?.role === "owner"
  const { deliveries, loading: deliveriesLoading, refetch } = useDeliveries(isAdmin)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const supabase = createClient()

      // Check if user is authenticated
      const { data, error: sessionError } = await supabase.auth.getUser()
      const user = data?.user

      if (sessionError || !user) {
        console.log("[Dashboard] No user found, redirecting to login")
        router.push("/auth/login")
        return
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

      if (profileError) {
        console.error("[Dashboard] Profile error:", profileError)
        toast.error("Failed to load profile")
        setIsCheckingAuth(false)
        return
      }

      // If user doesn't have organization, redirect to onboarding
      if (!profileData.organization_id && !profileData.is_temporary) {
        console.log("[Dashboard] No organization, redirecting to onboarding")
        router.push("/onboarding/create-organization")
        return
      }

      setIsCheckingAuth(false)
    } catch (error) {
      console.error("[Dashboard] Unexpected error:", error)
      toast.error("An unexpected error occurred")
      setIsCheckingAuth(false)
    }
  }

  if (isCheckingAuth || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  const activeDeliveries = deliveries.filter((d) => d.status === "active").length
  const totalViews = deliveries.reduce((sum, d) => sum + d.current_views, 0)
  const totalDownloads = deliveries.reduce((sum, d) => sum + d.current_downloads, 0)

  return (
    <AuthenticatedLayout>
      <div>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                Dashboard
                {isAdmin && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Organizational View
                  </Badge>
                )}
                {!isAdmin && <Badge variant="outline">Personal View</Badge>}
              </h2>
              <p className="text-muted-foreground">
                {isAdmin
                  ? "Manage all deliveries for your organization"
                  : "Manage your secure document deliveries"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Envíos Activos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDeliveries}</div>
              <p className="text-xs text-muted-foreground">
                Total of {deliveries.length} deliveries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visualizaciones</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews}</div>
              <p className="text-xs text-muted-foreground">Total views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Descargas</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDownloads}</div>
              <p className="text-xs text-muted-foreground">Total downloads</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-foreground">Recent Deliveries</h3>
        </div>

        <div className="space-y-4">
          {deliveriesLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading deliveries...
              </CardContent>
            </Card>
          ) : deliveries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">You have no deliveries yet</p>
              </CardContent>
            </Card>
          ) : (
            deliveries.map((delivery) => (
              <Card key={delivery.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {delivery.title}
                      </CardTitle>
                      <CardDescription>To: {delivery.recipient_email}</CardDescription>
                      {isAdmin && delivery.created_by_email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Users className="h-3 w-3" />
                          Sent by: "noreply@sealdrop.xyz"
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        delivery.status === "active"
                          ? "default"
                          : delivery.status === "revoked"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {delivery.status === "active"
                        ? "Active"
                        : delivery.status === "revoked"
                        ? "Revoked"
                        : "Expired"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(delivery.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expires</p>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(delivery.expires_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="font-medium">
                        {delivery.current_views} / {delivery.max_views}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Downloads</p>
                      <p className="font-medium">
                        {delivery.current_downloads} / {delivery.max_downloads}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <DeliveryActions
                      deliveryId={delivery.id}
                      deliveryTitle={delivery.title}
                      status={delivery.status}
                      isAdmin={isAdmin}
                      onActionComplete={refetch}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
