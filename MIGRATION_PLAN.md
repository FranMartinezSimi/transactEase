# 🏗️ Plan de Migración a Arquitectura por Features

## Objetivo
Reorganizar el proyecto de una arquitectura por tipo (api/, hooks/, components/) a una arquitectura por features (features/delivery/, features/audit/, etc.)

## Nueva Estructura

```
src/
├── features/
│   ├── delivery/
│   │   ├── api/                    # API routes específicos de delivery
│   │   ├── actions/                # Server actions (delivery-actions.ts)
│   │   ├── hooks/                  # useDeliveries.ts
│   │   ├── components/             # DeliveryActions.tsx
│   │   ├── services/               # delivery.service.ts, delivery.repository.ts
│   │   ├── types/                  # delivery.interface.ts
│   │   └── index.ts                # Public API del feature
│   │
│   ├── audit/
│   │   ├── hooks/                  # useAuditLogs.ts, useRole.ts
│   │   ├── components/             # CompliancePanel.tsx, ForensicMonitoring.tsx
│   │   ├── services/               # audit.service.ts (futuro)
│   │   ├── types/                  # AuditLog types
│   │   └── utils/                  # export-csv.ts
│   │
│   ├── auth/
│   │   ├── api/                    # Rutas de autenticación
│   │   ├── hooks/                  # useProfile.ts
│   │   ├── services/               # auth logic
│   │   └── types/
│   │
│   └── organization/
│       ├── hooks/
│       ├── services/
│       └── types/
│
├── shared/
│   ├── components/                 # AuthenticatedLayout, ui components
│   ├── hooks/                      # use-mobile.ts, useTheme.tsx
│   ├── lib/                        # supabase, email, logger, analytics
│   ├── types/                      # Global types
│   └── utils/                      # utils.ts
│
└── app/                           # Solo rutas, layouts, y re-exports
    ├── (auth)/
    ├── (dashboard)/
    ├── api/                       # Re-exports a features/*/api
    └── actions/                   # Re-exports a features/*/actions
```

## Plan de Ejecución

### ✅ Fase 1: Preparación
1. Crear nueva estructura de carpetas
2. Crear archivos index.ts en cada feature para exports públicos

### 🔄 Fase 2: Migrar Features (uno por uno)

#### 2.1 Feature: Delivery
**Archivos a mover:**
- `src/api/delivery/*` → `src/features/delivery/services/`
- `src/app/actions/delivery-actions.ts` → `src/features/delivery/actions/`
- `src/hooks/useDeliveries.ts` → `src/features/delivery/hooks/`
- `src/components/DeliveryActions.tsx` → `src/features/delivery/components/`
- API routes de delivery permanecen en app/api pero usan el nuevo feature

**Crear:**
- `src/features/delivery/index.ts` - Public API
- `src/features/delivery/types/index.ts` - Re-export types

#### 2.2 Feature: Audit
**Archivos a mover:**
- `src/hooks/useAuditLogs.ts` → `src/features/audit/hooks/`
- `src/hooks/useRole.ts` → `src/features/audit/hooks/`
- `src/components/CompliancePanel.tsx` → `src/features/audit/components/`
- `src/components/ForensicMonitoring.tsx` → `src/features/audit/components/`
- `src/lib/export-csv.ts` → `src/features/audit/utils/`

**Crear:**
- `src/features/audit/index.ts`
- `src/features/audit/types/index.ts`

#### 2.3 Feature: Auth
**Archivos a mover:**
- `src/hooks/useProfile.ts` → `src/features/auth/hooks/`
- `src/lib/auth/index.ts` → `src/features/auth/services/`
- `src/lib/validations/auth.ts` → `src/features/auth/utils/`

#### 2.4 Shared Code
**Archivos a mover:**
- `src/components/AuthenticatedLayout.tsx` → `src/shared/components/`
- `src/components/ui/*` → `src/shared/components/ui/`
- `src/hooks/use-mobile.ts` → `src/shared/hooks/`
- `src/hooks/useTheme.tsx` → `src/shared/hooks/`
- `src/lib/supabase/*` → `src/shared/lib/supabase/`
- `src/lib/email/*` → `src/shared/lib/email/`
- `src/lib/logger.ts` → `src/shared/lib/`
- `src/lib/analytics.ts` → `src/shared/lib/`
- `src/lib/utils.ts` → `src/shared/utils/`
- `src/lib/validations/common.ts` → `src/shared/utils/validations/`
- `src/lib/validations/file.ts` → `src/shared/utils/validations/`

### 🔄 Fase 3: Actualizar Imports
Para cada feature migrado, actualizar todos los imports en:
- Componentes de página (app/*)
- Otros features que lo usen
- API routes

Ejemplo:
```typescript
// Antes
import { useDeliveries } from "@/hooks/useDeliveries"
import { DeliveryService } from "@/api/delivery/delivery.service"

// Después
import { useDeliveries } from "@/features/delivery"
import { DeliveryService } from "@/features/delivery/services"
```

### 📝 Fase 4: Documentación
1. Crear `ARCHITECTURE.md` explicando la nueva estructura
2. Crear `features/delivery/README.md` con el flujo del feature
3. Crear `features/audit/README.md`
4. Actualizar comentarios en código

### ✅ Fase 5: Limpieza
1. Eliminar carpetas antiguas vacías (`src/api/`, `src/hooks/` viejos)
2. Verificar que no queden imports rotos
3. Correr tests (si existen)

## Beneficios de la Nueva Arquitectura

### 1. **Colocation** (Co-ubicación)
Todo lo relacionado con un feature está junto:
```
features/delivery/
  ├── actions/           # Server actions
  ├── api/              # API routes (re-exports)
  ├── hooks/            # Custom hooks
  ├── components/       # UI específico
  ├── services/         # Business logic
  └── types/            # TypeScript types
```

### 2. **Boundaries Claros**
- `features/*` = Features del negocio
- `shared/*` = Código reutilizable
- `app/*` = Solo rutas y layouts

### 3. **Escalabilidad**
Agregar un nuevo feature es simple:
```bash
mkdir src/features/notifications
# Copiar estructura base
# Implementar feature sin afectar otros
```

### 4. **Testeable**
Cada feature puede testearse independientemente.

### 5. **Onboarding Más Fácil**
"¿Cómo funciona delivery?" → Mira `features/delivery/`

## Comandos Útiles Durante la Migración

```bash
# Buscar todos los imports de un archivo
grep -r "from.*useDeliveries" src/

# Ver estructura de carpetas
tree src/features -L 3

# Verificar imports rotos (después de migración)
npm run build
```

## Notas

- **NO migrar API routes físicamente**: Mantenerlos en `app/api` pero que usen `features/*/services`
- **Usar barrel exports**: Cada feature debe exportar su API pública via `index.ts`
- **Backward compatibility**: Crear aliases temporales durante la migración
- **Migrar incrementalmente**: Un feature a la vez, verificando que funcione

## Estado Actual

- [ ] Fase 1: Preparación
- [ ] Fase 2.1: Migrar Delivery
- [ ] Fase 2.2: Migrar Audit
- [ ] Fase 2.3: Migrar Auth
- [ ] Fase 2.4: Migrar Shared
- [ ] Fase 3: Actualizar Imports
- [ ] Fase 4: Documentación
- [ ] Fase 5: Limpieza
