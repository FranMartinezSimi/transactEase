# Supabase Integration Guide

Guía completa de uso de Supabase en TransactEase con mejores prácticas de consistencia, manejo de errores y retry logic.

## 📁 Estructura

```
src/shared/lib/supabase/
├── client.ts       # Cliente para componentes cliente
├── server.ts       # Cliente para Server Components/Actions
├── admin.ts        # Cliente admin (Service Role Key)
├── env.ts          # Validación de variables de entorno
├── helpers.ts      # Helpers de manejo de errores
├── retry.ts        # Retry logic y circuit breaker
├── index.ts        # Exports centralizados
└── README.md       # Esta guía
```

## 🚀 Configuración Inicial

### 1. Variables de Entorno

Asegúrate de tener estas variables en tu `.env.local`:

```bash
# Públicas (frontend + backend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Privadas (solo backend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

**IMPORTANTE:** El Service Role Key bypasea RLS. NUNCA lo expongas al frontend.

### 2. Validación Automática

Las variables se validan automáticamente al importar cualquier cliente:

```typescript
import { createClient } from '@shared/lib/supabase/client'
// ✅ Si falta alguna variable, falla en build time, no en runtime
```

## 📖 Guías de Uso

### Client-Side (React Components)

```typescript
"use client"
import { createClient } from '@shared/lib/supabase/client'

export function MyComponent() {
  const supabase = createClient()

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')

    if (error) {
      console.error(error)
      return
    }

    return data
  }
}
```

### Server-Side (API Routes, Server Components)

```typescript
import { createClient } from '@shared/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Query con RLS activo
  const { data, error: queryError } = await supabase
    .from('deliveries')
    .select('*')
    .eq('created_by', user.id)

  return NextResponse.json({ data })
}
```

### Admin Operations (Bypass RLS)

```typescript
import { createAdminClient, createTemporaryUser } from '@shared/lib/supabase/admin'

// Opción 1: Cliente admin directo
export async function createTempUserHandler() {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('profiles')
    .insert({ /* ... */ })
  // ✅ RLS bypassed
}

// Opción 2: Helper dedicado
export async function inviteExternalUser(email: string) {
  const profile = await createTemporaryUser({
    email,
    fullName: 'External User',
    organizationId: 'org-id',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  })

  return profile
}
```

## 🛡️ Manejo de Errores Consistente

### Sin Helpers (❌ Inconsistente)

```typescript
const { data, error } = await supabase
  .from('deliveries')
  .select()
  .single()

if (error) {
  console.log(error) // ❌ Mal logueado
  throw new Error(error.message) // ❌ Mensaje genérico
}
```

### Con Helpers (✅ Consistente)

```typescript
import { fetchSingle } from '@shared/lib/supabase/helpers'

const delivery = await fetchSingle(
  supabase.from('deliveries').select().eq('id', id).single(),
  {
    operation: 'fetchDelivery',
    table: 'deliveries',
    userId: user.id
  }
)
// ✅ Error handling automático
// ✅ Logs estructurados
// ✅ Mensajes user-friendly
```

### Helpers Disponibles

```typescript
import {
  fetchSingle,      // Para .single() queries
  fetchMany,        // Para queries que retornan arrays
  executeQuery,     // Para insert/update/delete
  recordExists,     // Para verificar existencia
  validateUserAccess // Para validar permisos
} from '@shared/lib/supabase/helpers'

// Ejemplo: fetchSingle
const delivery = await fetchSingle(
  supabase.from('deliveries').select().eq('id', id).single(),
  { operation: 'fetchDelivery', table: 'deliveries', userId }
)

// Ejemplo: fetchMany
const deliveries = await fetchMany(
  supabase.from('deliveries').select().eq('organization_id', orgId),
  { operation: 'listDeliveries', table: 'deliveries', userId }
)

// Ejemplo: executeQuery
const newDelivery = await executeQuery(
  supabase.from('deliveries').insert(data).select().single(),
  { operation: 'createDelivery', table: 'deliveries', userId }
)

// Ejemplo: validateUserAccess
const hasAccess = await validateUserAccess(
  supabase,
  user.id,
  deliveryId,
  'deliveries',
  'created_by'
)
```

## 🔁 Retry Logic

### Operaciones Críticas

```typescript
import { withRetry, CRITICAL_RETRY_CONFIG } from '@shared/lib/supabase/retry'

const delivery = await withRetry(
  async () => {
    const { data, error } = await supabase
      .from('deliveries')
      .insert(deliveryData)
      .select()
      .single()

    if (error) throw error
    return data
  },
  CRITICAL_RETRY_CONFIG,
  'createDelivery'
)
// ✅ Reintenta hasta 5 veces con exponential backoff
// ✅ Solo reintenta en errores transitorios (timeout, connection)
```

### Configuraciones Disponibles

```typescript
import {
  DEFAULT_RETRY_CONFIG,   // 3 retries, 1s delay
  CRITICAL_RETRY_CONFIG,  // 5 retries, 500ms delay
  QUICK_RETRY_CONFIG,     // 2 retries, 500ms delay
} from '@shared/lib/supabase/retry'
```

### Helper para Queries Supabase

```typescript
import { retrySupabaseQuery, CRITICAL_RETRY_CONFIG } from '@shared/lib/supabase/retry'

const delivery = await retrySupabaseQuery(
  () => supabase.from('deliveries').select().eq('id', id).single(),
  CRITICAL_RETRY_CONFIG,
  'fetchDelivery'
)
// ✅ Automáticamente maneja { data, error }
```

### Circuit Breaker (Protección Avanzada)

```typescript
import { withRetryAndCircuitBreaker } from '@shared/lib/supabase/retry'

const data = await withRetryAndCircuitBreaker(
  async () => {
    const { data, error } = await supabase.from('deliveries').select()
    if (error) throw error
    return data
  },
  CRITICAL_RETRY_CONFIG,
  'listDeliveries'
)
// ✅ Retry + Circuit Breaker
// ✅ Si falla 5 veces, abre el circuito por 60s
```

## 🎯 Patrones Recomendados

### ✅ Patrón 1: API Route con Todo el Stack

```typescript
import { createClient } from '@shared/lib/supabase/server'
import { fetchSingle } from '@shared/lib/supabase/helpers'
import { withRetry, CRITICAL_RETRY_CONFIG } from '@shared/lib/supabase/retry'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Fetch con retry + error handling
  const delivery = await withRetry(
    () => fetchSingle(
      supabase.from('deliveries').select().eq('id', id).single(),
      {
        operation: 'fetchDelivery',
        table: 'deliveries',
        userId: user.id
      }
    ),
    CRITICAL_RETRY_CONFIG,
    'fetchDeliveryAPI'
  )

  return NextResponse.json({ delivery })
}
```

### ✅ Patrón 2: Server Action Simple

```typescript
"use server"
import { createClient } from '@shared/lib/supabase/server'

export async function updateDeliveryStatus(id: string, status: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deliveries')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update: ${error.message}`)
  }

  return data
}
```

### ✅ Patrón 3: Cron Job con Admin Client

```typescript
import { cleanupExpiredTempUsers } from '@shared/lib/supabase/admin'

export async function GET() {
  // Verificar cron secret
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Cleanup con admin client
  const deletedCount = await cleanupExpiredTempUsers()

  return NextResponse.json({
    success: true,
    deletedCount
  })
}
```

## ⚠️ Errores Comunes

### ❌ Error 1: Usar Admin Client en Frontend

```typescript
"use client"
import { createAdminClient } from '@shared/lib/supabase/admin'

export function MyComponent() {
  const admin = createAdminClient() // ❌ CRASH!
  // Error: Admin client cannot be created on client-side
}
```

**Solución:** Usa `createClient` from `'./client'`

### ❌ Error 2: No Validar Env Vars

```typescript
// ❌ Antes (fallaba en runtime)
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // undefined en producción
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ✅ Ahora (falla en build time)
import { createClient } from '@shared/lib/supabase/client'
const client = createClient() // Validado automáticamente
```

### ❌ Error 3: Retry en Errores No-Transitorios

```typescript
// ❌ Mal: reintenta un error de permisos (nunca va a funcionar)
await withRetry(
  () => supabase.from('deliveries').delete().eq('id', id) // RLS blocks
)
// Resultado: 5 retries inútiles

// ✅ Bien: retry solo maneja errores transitorios
// Si el error es de permisos (42501), NO reintenta
```

## 📊 Monitoring

### Ver Estado del Circuit Breaker

```typescript
import { getCircuitBreakerState } from '@shared/lib/supabase/retry'

// En un endpoint de health check
export async function GET() {
  const cbState = getCircuitBreakerState()
  return NextResponse.json({
    circuitBreaker: cbState
    // { state: 'closed', failures: 0, lastFailureTime: 0 }
  })
}
```

### Reset Manual (Testing)

```typescript
import { resetCircuitBreaker } from '@shared/lib/supabase/retry'

// Solo para testing o intervención manual
resetCircuitBreaker()
```

## 🔒 Seguridad

### Service Role Key

**NUNCA:**
- ❌ Exponerlo en el frontend
- ❌ Incluirlo en código cliente ("use client")
- ❌ Committearlo a Git
- ❌ Loguearlo en producción

**SIEMPRE:**
- ✅ Usar solo en server-side
- ✅ Guardarlo en .env.local (local) / Vercel env vars (producción)
- ✅ Validar que `typeof window === 'undefined'`
- ✅ Usar createAdminClient() que ya valida esto

### Row Level Security (RLS)

```typescript
// Client normal: RLS activo
const supabase = await createClient()
await supabase.from('deliveries').select()
// ✅ Solo ve sus propios deliveries (RLS policy)

// Admin client: RLS bypassed
const admin = createAdminClient()
await admin.from('deliveries').select()
// ⚠️ Ve TODOS los deliveries (usa con cuidado)
```

## 🧪 Testing

```typescript
// Mock del cliente para tests
jest.mock('@shared/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}))

// Mock de helpers
jest.mock('@shared/lib/supabase/helpers', () => ({
  fetchSingle: jest.fn()
}))
```

## 📚 Referencias

- [Supabase Docs](https://supabase.com/docs)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js App Router](https://nextjs.org/docs/app)
