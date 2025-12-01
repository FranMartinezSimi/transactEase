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
import { EarlyAdopterWelcomeModal } from "@/components/modals/EarlyAdopterWelcomeModal"

export default function CreateOrganizationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [formData, setFormData] = useState({
    organizationName: "",
  })
  const [showEarlyAdopterModal, setShowEarlyAdopterModal] = useState(false)
  const [earlyAdopterSlot, setEarlyAdopterSlot] = useState<{
    slotNumber: number;
    totalSlots: number;
  } | null>(null)

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

      // Step 1: Check early adopter availability
      const { data: availabilityData } = await fetch('/api/early-adopter/availability').then(r => r.json())
      const isEarlyAdopterAvailable = availabilityData?.available || false
      const slotsRemaining = availabilityData?.slotsRemaining || 0

      // Generate UUID for the organization
      const orgId = crypto.randomUUID()

      // Step 2: Create organization with early adopter flag
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          id: orgId,
          name: formData.organizationName.trim(),
          is_early_adopter: isEarlyAdopterAvailable,
          early_adopter_joined_at: isEarlyAdopterAvailable ? new Date().toISOString() : null,
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

      // Step 3: Claim early adopter slot if available
      if (isEarlyAdopterAvailable) {
        const { data: claimData } = await supabase.rpc('claim_early_adopter_slot', {
          org_id: org.id
        })

        if (claimData?.[0]?.success) {
          // Calculate slot number (50 total - remaining + 1)
          const slotNumber = 50 - slotsRemaining + 1
          setEarlyAdopterSlot({
            slotNumber,
            totalSlots: 50
          })
        }
      }

      // Step 4: Update user profile with organization
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

      // Step 5: Subscription is auto-created by database trigger

      toast.success("Organization created successfully!")
      setIsLoading(false)

      // Step 6: Show early adopter modal or redirect
      if (isEarlyAdopterAvailable && earlyAdopterSlot) {
        setShowEarlyAdopterModal(true)
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("[Onboarding] Unexpected error:", error)
      toast.error("An unexpected error occurred")
      setIsLoading(false)
    }
  }

  function handleModalClose() {
    setShowEarlyAdopterModal(false)
    router.push("/dashboard")
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <AuthCard
        title="Complete Your Profile"
        description="Quick setup to start sending secure files"
        footer={
          <div className="w-full text-center">
            <p className="text-sm text-muted-foreground">
              You can customize settings later from your dashboard
            </p>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Organization Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="organizationName">
              Organization Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="organizationName"
                type="text"
                placeholder="Your law firm, company, or organization name"
                className="pl-10"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                required
                disabled={isLoading}
                minLength={2}
                maxLength={100}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This will be shown to recipients when you send files
            </p>
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary"
            disabled={isLoading || !formData.organizationName.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Continue to Dashboard"
            )}
          </Button>
        </form>
      </AuthCard>

      {/* Early Adopter Welcome Modal */}
      {earlyAdopterSlot && (
        <EarlyAdopterWelcomeModal
          isOpen={showEarlyAdopterModal}
          onClose={handleModalClose}
          slotNumber={earlyAdopterSlot.slotNumber}
          totalSlots={earlyAdopterSlot.totalSlots}
        />
      )}
    </>
  )
}
