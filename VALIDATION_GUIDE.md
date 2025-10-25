# Zod Validation Guide - TransactEase

How to use Zod schemas for form validation and API validation.

---

## 📁 File Organization

```
src/lib/validations/
├── auth.ts      # Authentication schemas (login, register, etc.)
├── file.ts      # File/document schemas (upload, share, etc.)
├── common.ts    # Reusable validators (email, uuid, pagination, etc.)
└── user.ts      # User management schemas (future)
```

---

## 🎯 How to Use Schemas

### **Method 1: Manual Validation (Current)**

This is what you're using now in your login/register pages.

```tsx
"use client"

import { useState } from "react"
import { loginSchema, type LoginFormData } from "@/lib/validations/auth"

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({}) // Clear previous errors

    // Validate with Zod
    const result = loginSchema.safeParse(formData)

    if (!result.success) {
      // Extract errors
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    // Data is valid, call API
    const validData: LoginFormData = result.data
    await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(validData)
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}

      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
      {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}

      <button type="submit">Login</button>
    </form>
  )
}
```

---

### **Method 2: React Hook Form + Zod (Recommended)**

Much cleaner and automatic validation.

**1. Install dependencies:**

```bash
npm install react-hook-form @hookform/resolvers
```

**2. Use in component:**

```tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginFormData } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    // Data is already validated!
    console.log(data)

    await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-destructive text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-destructive text-sm">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}
```

---

### **Method 3: With shadcn Form Component (Best)**

shadcn has a `Form` component that integrates perfectly with react-hook-form + Zod.

**1. Install shadcn form:**

```bash
npx shadcn@latest add form
```

**2. Use in component:**

```tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginFormData } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  })

  const onSubmit = async (data: LoginFormData) => {
    console.log(data) // Fully typed and validated!

    await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@company.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Form>
  )
}
```

---

## 🔌 API Validation (Server-Side)

### **Validate in API Routes:**

```tsx
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server"
import { loginSchema } from "@/lib/validations/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.errors },
        { status: 400 }
      )
    }

    // Use validated data
    const { email, password } = result.data

    // Your auth logic here...
    const user = await authenticateUser(email, password)

    return NextResponse.json({ success: true, user })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

### **Validate in Server Actions:**

```tsx
// src/app/actions/auth.ts
'use server'

import { loginSchema } from "@/lib/validations/auth"

export async function loginAction(formData: FormData) {
  // Convert FormData to object
  const data = {
    email: formData.get('email'),
    password: formData.get('password')
  }

  // Validate
  const result = loginSchema.safeParse(data)

  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0].message
    }
  }

  // Use validated data
  const { email, password } = result.data

  // Your auth logic...
  const user = await authenticateUser(email, password)

  return { success: true, user }
}
```

---

## 📚 Examples for Your Project

### **Example 1: Register Form**

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth"

const form = useForm<RegisterFormData>({
  resolver: zodResolver(registerSchema),
  defaultValues: {
    name: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: ""
  }
})

const onSubmit = async (data: RegisterFormData) => {
  // data.name, data.email, etc. are all validated and typed!
  await fetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}
```

### **Example 2: File Upload Form**

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { sendFileSchema, type SendFileFormData } from "@/lib/validations/file"

const form = useForm<SendFileFormData>({
  resolver: zodResolver(sendFileSchema),
  defaultValues: {
    expiresIn: "24h",
    maxViews: 10,
    requirePassword: false,
    notifyOnAccess: true
  }
})

const onSubmit = async (data: SendFileFormData) => {
  const formData = new FormData()
  formData.append('file', data.file)
  formData.append('expiresIn', data.expiresIn)
  // ... append other fields

  await fetch('/api/files/send', {
    method: 'POST',
    body: formData
  })
}
```

### **Example 3: Reusing Common Validators**

```tsx
// src/lib/validations/user.ts
import { z } from "zod"
import { emailValidator, nameValidator } from "./common"

export const updateUserSchema = z.object({
  name: nameValidator,
  email: emailValidator,
  bio: z.string().max(200).optional()
})
```

---

## 🎨 Error Display Component

Create a reusable error display:

```tsx
// src/components/form-error.tsx
interface FormErrorProps {
  message?: string
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null

  return (
    <p className="text-sm font-medium text-destructive">
      {message}
    </p>
  )
}

// Usage
<FormError message={errors.email?.message} />
```

---

## ✅ Benefits of This Approach

1. **Type Safety** - Full TypeScript types from Zod schemas
2. **DRY** - Define validation once, use everywhere (client + server)
3. **Consistency** - Same rules on frontend and backend
4. **Better UX** - Real-time validation feedback
5. **Maintainable** - Easy to update validation rules
6. **Documented** - Schemas serve as documentation

---

## 🚀 Next Steps

1. **Install react-hook-form:**
   ```bash
   npm install react-hook-form @hookform/resolvers
   ```

2. **Install shadcn form:**
   ```bash
   npx shadcn@latest add form
   ```

3. **Update your login/register pages** to use react-hook-form

4. **Create API routes** that validate with the same schemas

5. **Add more schemas** as you build features (file upload, settings, etc.)

---

## 📖 Resources

- [Zod Documentation](https://zod.dev)
- [React Hook Form](https://react-hook-form.com)
- [shadcn/ui Form](https://ui.shadcn.com/docs/components/form)
- [Zod + React Hook Form Guide](https://react-hook-form.com/get-started#SchemaValidation)

---

**Happy validating!** ✨
