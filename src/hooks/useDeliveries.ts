"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Delivery {
  id: string
  title: string
  message?: string
  recipient_email: string
  expires_at: string
  current_views: number
  max_views: number
  current_downloads: number
  max_downloads: number
  status: "active" | "expired" | "revoked"
  created_at: string
  created_by_email?: string // Email del creador (para vista admin)
}

export function useDeliveries(isAdmin = false) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setDeliveries([])
        setLoading(false)
        return
      }

      // Get user profile to check organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id, role")
        .eq("id", user.id)
        .single()

      if (!profile?.organization_id) {
        setDeliveries([])
        setLoading(false)
        return
      }

      // Check if user is admin/owner
      const canViewAll = profile.role === "admin" || profile.role === "owner"
      
      let query = supabase
        .from("deliveries")
        .select(`
          id,
          title,
          message,
          recipient_email,
          expires_at,
          current_views,
          max_views,
          current_downloads,
          max_downloads,
          status,
          created_at,
          sender_id,
          profiles!deliveries_sender_id_fkey (
            email
          )
        `)
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false })

        console.log("query:", query);

      // If not admin, only show own deliveries
      if (!canViewAll) {
        query = query.eq("sender_id", user.id)
      }

      const { data: deliveriesData, error: deliveriesError } = await query

      if (deliveriesError) {

        console.error("[useDeliveries] Error fetching deliveries:", deliveriesError)
        setError(deliveriesError.message)
        setDeliveries([])
      } else {
        // Transform data to match interface
        const transformedDeliveries: Delivery[] = (deliveriesData || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          message: d.message,
          recipient_email: d.recipient_email,
          expires_at: d.expires_at,
          current_views: d.current_views || 0,
          max_views: d.max_views,
          current_downloads: d.current_downloads || 0,
          max_downloads: d.max_downloads,
          status: d.status,
          created_at: d.created_at,
          created_by_email: d.profiles?.email
        }))
        setDeliveries(transformedDeliveries)
        setError(null)
      }
    } catch (err) {
      console.error("[useDeliveries] Unexpected error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      setDeliveries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeliveries()
  }, [isAdmin])

  return {
    deliveries,
    loading,
    error,
    refetch: fetchDeliveries,
  }
}
