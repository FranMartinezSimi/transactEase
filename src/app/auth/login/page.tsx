"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthCard } from "@/components/auth/auth-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Loader2 } from "lucide-react"
import Link from "next/link"
import { OAuthButton } from "@/components/auth/oauth-button"
import { signInWithGoogle, signInWithEmail } from "@/lib/auth"
import { toast } from "sonner"

type AuthMode = "google" | "credentials"

export default function LoginPage() {
  const router = useRouter()
  const [authMode, setAuthMode] = useState<AuthMode>("google")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  const handleGoogleSignIn = async () => {
    setIsLoading(true)

    try {
      const result = await signInWithGoogle()

      if (!result.success) {
        toast.error(result.error || "Failed to sign in with Google")
        setIsLoading(false)
      }
      // If successful, user will be redirected by OAuth flow
    } catch (error) {
      console.error("[Login] Google sign-in error:", error)
      toast.error("An unexpected error occurred")
      setIsLoading(false)
    }
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signInWithEmail(formData.email, formData.password)

      if (!result.success) {
        toast.error(result.error || "Login failed")
        setIsLoading(false)
        return
      }

      toast.success("Welcome back!")
      router.push("/dashboard")
    } catch (error) {
      console.error("[Login] Credentials error:", error)
      toast.error("An unexpected error occurred")
      setIsLoading(false)
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your Sealdrop account"
      footer={
        <div className="w-full text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="text-primary hover:underline font-semibold"
            >
              Sign up
            </Link>
          </p>
        </div>
      }
    >
      {/* Auth Mode Toggle */}
      <div className="flex items-center justify-center gap-2 p-1 bg-muted rounded-lg mb-4">
        <button
          type="button"
          onClick={() => setAuthMode("google")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${authMode === "google"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
            }`}
          disabled={isLoading}
        >
          Google
        </button>
        <button
          type="button"
          onClick={() => setAuthMode("credentials")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${authMode === "credentials"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
            }`}
          disabled={isLoading}
        >
          Email/Password
        </button>
      </div>

      {/* Google OAuth */}
      {authMode === "google" && (
        <div className="space-y-4">
          <div className="flex flex-row w-full align-middle justify-center">
            <OAuthButton
              provider="Google"
              text="Sign in with Google"
              onClick={handleGoogleSignIn}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Recommended for faster and more secure login
          </p>
        </div>
      )}

      {/* Email/Password Form */}
      {authMode === "credentials" && (
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                className="pl-10"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full gradient-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
