"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@shared/lib/supabase/client"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { Loader2, Building2 } from "lucide-react"
import { toast } from "sonner"
import { AuthCard } from "@shared/components/auth/auth-card"

export default function CreateOrganizationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [formData, setFormData] = useState({
    organizationName: "",
  })

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const supabase = createClient()

      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.log("[Onboarding] No session found, redirecting to login")
        router.push("/auth/login")
        return
      }

      // Check if user already has organization
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id, is_temporary")
        .eq("id", session.user.id)
        .single()

      if (profileError) {
        console.error("[Onboarding] Profile error:", profileError)
        setIsCheckingAuth(false)
        return
      }

      // If user already has organization, redirect to dashboard
      if (profileData.organization_id) {
        console.log("[Onboarding] User already has organization, redirecting to dashboard")
        router.push("/dashboard")
        return
      }

      // If user is temporary, they shouldn't be here
      if (profileData.is_temporary) {
        console.log("[Onboarding] Temporary user, redirecting to dashboard")
        router.push("/dashboard")
        return
      }

      setIsCheckingAuth(false)
    } catch (error) {
      console.error("[Onboarding] Unexpected error:", error)
      toast.error("An unexpected error occurred")
      setIsCheckingAuth(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Session expired. Please log in again")
        router.push("/auth/login")
        return
      }

      // Generate UUID for the organization
      const orgId = crypto.randomUUID()

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          id: orgId,
          name: formData.organizationName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (orgError) {
        console.error("[Onboarding] Organization creation error:", orgError)
        toast.error("Failed to create organization")
        setIsLoading(false)
        return
      }

      // Update user profile with organization
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          organization_id: org.id,
          role: "owner", // First user becomes owner
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id)

      if (updateError) {
        console.error("[Onboarding] Profile update error:", updateError)
        toast.error("Failed to update profile")
        setIsLoading(false)
        return
      }

      // Create subscription for the organization
      const subId = crypto.randomUUID()
      const { error: subError } = await supabase
        .from("subscriptions")
        .insert({
          id: subId,
          organization_id: org.id,
          plan: "free",
          status: "trialing",
          max_deliveries_per_month: 10,
          max_storage_gb: 1,
          max_users: 3,
          max_file_size: 10,
          ai_compliance_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (subError) {
        console.error("[Onboarding] Subscription creation error:", subError)
        // Don't fail the whole flow, just log it
      }

      toast.success("Organization created successfully!")
      router.push("/dashboard")
    } catch (error) {
      console.error("[Onboarding] Unexpected error:", error)
      toast.error("An unexpected error occurred")
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <AuthCard
      title="Create Your Organization"
      description="Set up your organization to start sending secure documents"
      footer={
        <div className="w-full text-center">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <a href="/support" className="text-primary hover:underline font-semibold">
              Contact Support
            </a>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="organizationName">Organization Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="organizationName"
              type="text"
              placeholder="Acme Inc."
              className="pl-10"
              value={formData.organizationName}
              onChange={(e) => setFormData({ organizationName: e.target.value })}
              required
              disabled={isLoading}
              minLength={2}
              maxLength={100}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            This will be the name of your workspace
          </p>
        </div>

        <Button
          type="submit"
          className="w-full gradient-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating organization...
            </>
          ) : (
            "Create Organization"
          )}
        </Button>
      </form>
    </AuthCard>
  )
}
