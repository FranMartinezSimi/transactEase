"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Profile {
  id: string
  organization_id: string | null
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  organization?: {
    id: string
    name: string
    subscription?: {
      plan: string
      status: string
      ai_compliance_enabled: boolean
    }
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(`
        id,
        organization_id,
        email,
        full_name,
        role,
        is_active,
        organizations (
          id,
          name,
          subscriptions (
            plan,
            status,
            ai_compliance_enabled
          )
        )
      `)
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("[useProfile] Error fetching profile:", profileError)
      setError(profileError.message)
      setProfile(null)
    } else {
      // Transform data to match interface
      // Handle organizations - it might be an array or object depending on the query
      const org = Array.isArray(profileData.organizations)
        ? profileData.organizations[0]
        : profileData.organizations;

      const transformedProfile: Profile = {
        id: profileData.id,
        organization_id: profileData.organization_id,
        email: profileData.email,
        full_name: profileData.full_name,
        role: profileData.role,
        is_active: profileData.is_active,
        organization: org ? {
          id: org.id,
          name: org.name,
          subscription: Array.isArray(org.subscriptions) && org.subscriptions[0] ? {
            plan: org.subscriptions[0].plan,
            status: org.subscriptions[0].status,
            ai_compliance_enabled: org.subscriptions[0].ai_compliance_enabled
          } : undefined
        } : undefined
      }
      setProfile(transformedProfile)
      setError(null)
    }
    } catch (err) {
      console.error("[useProfile] Unexpected error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  }
}