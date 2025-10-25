# Next.js App Router Guide - TransactEase

This guide explains how the App Router works and how to use the reusable components.

---

## 📁 File Structure (App Router)

```
src/app/
├── layout.tsx                  # Root layout (wraps all pages)
├── page.tsx                    # Landing page (/)
├── globals.css                 # Global styles + theme
├── auth/
│   ├── login/
│   │   └── page.tsx           # Login page (/auth/login)
│   └── register/
│       └── page.tsx           # Register page (/auth/register)
└── coming-soon/
    └── page.tsx               # Coming soon (/coming-soon)

src/components/
├── auth/
│   └── auth-card.tsx          # Reusable auth layout
└── ui/                        # shadcn components
    ├── button.tsx
    ├── input.tsx
    ├── label.tsx
    └── card.tsx
```

---

## 🧭 How App Router Works

### 1. **File-Based Routing**

The folder structure directly maps to URLs:

```
src/app/page.tsx              → /
src/app/auth/login/page.tsx   → /auth/login
src/app/auth/register/page.tsx → /auth/register
src/app/dashboard/page.tsx    → /dashboard
```

### 2. **Server Components by Default**

All components are **Server Components** unless you add `"use client"`:

```tsx
// Server Component (default) - runs on server, can fetch data directly
export default function Page() {
  const data = await fetch('...')  // ✅ Works
  return <div>{data}</div>
}
```

```tsx
// Client Component - add "use client" when you need:
// - useState, useEffect, etc.
// - Event handlers (onClick, onChange)
// - Browser APIs
"use client"

export default function Page() {
  const [count, setCount] = useState(0)  // ✅ Now works
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### 3. **Layouts**

`layout.tsx` wraps all child pages:

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Header />       {/* Shows on all pages */}
        {children}       {/* Page content goes here */}
        <Footer />       {/* Shows on all pages */}
      </body>
    </html>
  )
}
```

You can have nested layouts:

```
src/app/dashboard/
├── layout.tsx       # Dashboard layout (sidebar, nav)
└── page.tsx         # Dashboard home
```

---

## 🎨 Reusable Components

### **AuthCard Component**

Located at: `src/components/auth/auth-card.tsx`

**Purpose:** Reusable layout for all auth pages (login, register, forgot password, etc.)

**Usage:**

```tsx
import { AuthCard } from "@/components/auth/auth-card"

export default function MyAuthPage() {
  return (
    <AuthCard
      title="Page Title"
      description="Page description"
      footer={<p>Optional footer content</p>}
    >
      {/* Your form or content here */}
      <form>...</form>
    </AuthCard>
  )
}
```

**Features:**
- ✅ Centered card with TransactEase branding
- ✅ Glass morphism effect
- ✅ Back to home link
- ✅ Responsive design
- ✅ Dark theme support

---

## 🔘 shadcn/ui Components

### **Button**

```tsx
import { Button } from "@/components/ui/button"

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>

// With gradient (custom)
<Button className="gradient-primary">Get Started</Button>
```

### **Input**

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>

// With icon
<div className="relative">
  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
  <Input
    type="email"
    placeholder="you@example.com"
    className="pl-10"  // Make room for icon
  />
</div>
```

### **Card**

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

## 🚀 How to Create a New Page

### Example: Create a "Forgot Password" Page

**1. Create the file:**

```bash
touch src/app/auth/forgot-password/page.tsx
```

**2. Add the code:**

```tsx
"use client"

import { useState } from "react"
import { AuthCard } from "@/components/auth/auth-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // TODO: Call your API
    // await fetch('/api/auth/forgot-password', { ... })

    await new Promise(resolve => setTimeout(resolve, 2000))
    setSent(true)
    setIsLoading(false)
  }

  return (
    <AuthCard
      title="Reset Password"
      description="Enter your email to receive a reset link"
      footer={
        <Link href="/auth/login" className="text-sm text-primary hover:underline">
          Back to login
        </Link>
      }
    >
      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      ) : (
        <div className="text-center py-8">
          <p className="text-foreground mb-4">Check your email!</p>
          <p className="text-sm text-muted-foreground">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
        </div>
      )}
    </AuthCard>
  )
}
```

**3. Done!** The page is now accessible at `/auth/forgot-password`

---

## 🔌 How to Connect to Your API

### Example: Login API Call

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password
      })
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const data = await response.json()

    // Save token (example)
    localStorage.setItem('auth-token', data.token)

    // Redirect to dashboard
    router.push('/dashboard')

  } catch (error) {
    console.error('Login error:', error)
    alert('Invalid credentials')
  } finally {
    setIsLoading(false)
  }
}
```

### Using Server Actions (Recommended)

Create: `src/app/actions/auth.ts`

```tsx
'use server'

export async function loginAction(formData: FormData) {
  const email = formData.get('email')
  const password = formData.get('password')

  // Your auth logic here
  const user = await db.user.findUnique({ where: { email } })

  if (!user || !verifyPassword(password, user.password)) {
    return { error: 'Invalid credentials' }
  }

  // Create session, set cookies, etc.
  await createSession(user.id)

  return { success: true }
}
```

Use in component:

```tsx
import { loginAction } from '@/app/actions/auth'
import { useFormState } from 'react-dom'

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, null)

  return (
    <form action={formAction}>
      <Input name="email" type="email" required />
      <Input name="password" type="password" required />
      <Button type="submit">Login</Button>
      {state?.error && <p className="text-destructive">{state.error}</p>}
    </form>
  )
}
```

---

## 📦 Installing More shadcn Components

```bash
# Forms
npx shadcn@latest add form
npx shadcn@latest add checkbox
npx shadcn@latest add select

# UI
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add toast
npx shadcn@latest add avatar

# Data
npx shadcn@latest add table
npx shadcn@latest add badge
```

---

## 🎨 Custom CSS Classes

Your theme includes these custom utilities:

```tsx
// Gradients
<div className="gradient-primary">Green gradient</div>
<div className="gradient-accent">Orange gradient</div>
<div className="gradient-text">Gradient text</div>

// Effects
<div className="glass">Glass morphism</div>
<div className="animate-fade-in-up">Fade in animation</div>
<div className="animate-pulse-glow">Pulse glow</div>
<div className="animate-shimmer">Shimmer effect</div>
```

---

## 🛡️ Middleware Protection

`src/middleware.ts` controls route access:

```tsx
// Public routes (anyone can access)
const publicPaths = ['/', '/coming-soon']

// Auth routes (no login required)
if (pathname.startsWith('/auth')) {
  return NextResponse.next()
}

// Protected routes (require authentication)
// Add your logic here when you implement auth
```

---

## 📚 Next Steps

1. **Implement API Routes:**
   - Create `src/app/api/auth/login/route.ts`
   - Create `src/app/api/auth/register/route.ts`

2. **Add Protected Routes:**
   - Create dashboard layout
   - Update middleware to check auth

3. **Add More Components:**
   ```bash
   npx shadcn@latest add toast  # For notifications
   npx shadcn@latest add dialog # For modals
   ```

---

## 🐛 Common Patterns

### Redirect After Login

```tsx
import { useRouter } from 'next/navigation'

const router = useRouter()

// After successful login
router.push('/dashboard')
```

### Show Loading State

```tsx
const [isLoading, setIsLoading] = useState(false)

<Button disabled={isLoading}>
  {isLoading ? <Loader2 className="animate-spin" /> : "Submit"}
</Button>
```

### Handle Errors

```tsx
const [error, setError] = useState<string | null>(null)

try {
  await loginAction(formData)
} catch (err) {
  setError(err.message)
}

{error && <p className="text-destructive text-sm">{error}</p>}
```

---

## 📖 Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)

---

**Happy coding!** 🚀
