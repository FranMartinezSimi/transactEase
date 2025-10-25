"use client"

import { useState } from "react"
import { AuthCard } from "@/components/auth/auth-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, User, Building2, Loader2 } from "lucide-react"
import Link from "next/link"
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth"
import { toast } from "sonner"

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: ""
  })
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    const validationResult = registerSchema.safeParse(formData)
    if (!validationResult.success) {
      const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {}
      validationResult.error.issues.forEach((error) => {
        const fieldName = error.path[0] as keyof RegisterFormData
        fieldErrors[fieldName] = error.message
      })
      setErrors(fieldErrors)
      toast.error("Please fix the errors in the form")
      setIsLoading(false)
      return
    }

    // TODO: Implement your registration logic here
    // Example:
    // const response = await fetch('/api/auth/register', {
    //   method: 'POST',
    //   body: JSON.stringify(validationResult.data)
    // })
    //
    // if (response.ok) {
    //   toast.success("Account created successfully!")
    //   router.push('/dashboard')
    // } else {
    //   toast.error("Registration failed. Please try again.")
    // }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log("Register data:", validationResult.data)
    toast.success("Account created successfully! 🎉")
    setIsLoading(false)
  }

  return (
    <AuthCard
      title="Create your account"
      description="Get started with TransactEase in seconds"
      footer={
        <div className="w-full space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary hover:underline font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              className="pl-10"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

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
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        {/* Company Field */}
        <div className="space-y-2">
          <Label htmlFor="company">Company (Optional)</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="company"
              type="text"
              placeholder="Acme Inc."
              className="pl-10"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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
              minLength={8}
              disabled={isLoading}
            />
          </div>
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters with uppercase, lowercase, and number
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="pl-10"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>
          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
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
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthCard>
  )
}
