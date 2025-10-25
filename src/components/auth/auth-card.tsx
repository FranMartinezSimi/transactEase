import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"
import Link from "next/link"

interface AuthCardProps {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Shield className="h-10 w-10 text-primary" />
          <span className="text-2xl font-bold text-foreground">TransactEase</span>
        </Link>

        {/* Card */}
        <Card className="glass border-2 border-primary/20 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {title}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {children}
          </CardContent>

          {footer && (
            <CardFooter className="flex flex-col space-y-4">
              {footer}
            </CardFooter>
          )}
        </Card>

        {/* Back to home */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/" className="hover:text-primary transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
