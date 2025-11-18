# Database Schema - Sealdrop/TransactEase

**Last Updated**: November 2024
**Database**: PostgreSQL (Supabase)
**Version**: 1.0

## 📊 Overview

El sistema de base de datos está diseñado para gestionar:
- **Organizaciones multi-tenant** con usuarios y permisos
- **Deliveries** (entregas seguras de archivos)
- **Autenticación OAuth** con Google SSO
- **Audit trails** completos
- **Configuración granular** por organización

---

## 🗂️ Core Tables

### 1. `organizations`
Tabla central para multi-tenancy. Cada organización es independiente.

```sql
organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  domain TEXT,  -- Dominio verificado (ej: "empresa.com")
  logo_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,

  -- DEPRECATED (movidos a organization_settings)
  max_views INTEGER,
  max_downloads INTEGER,
  max_expiration_hours INTEGER,
  min_expiration_hours INTEGER
)
```

**Relaciones:**
- `1:N` → `profiles` (usuarios de la organización)
- `1:N` → `deliveries` (entregas creadas por la org)
- `1:1` → `organization_settings` (configuración)
- `1:N` → `invitations` (invitaciones pendientes)
- `1:N` → `organization_invitations` (invitaciones SSO)

**Índices:**
- `idx_organizations_slug` ON `slug`
- `idx_organizations_domain` ON `domain`

---

### 2. `profiles`
Perfiles de usuario. Se crea automáticamente vía trigger cuando un usuario hace OAuth.

```sql
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  organization_id UUID REFERENCES organizations(id),
  role TEXT CHECK (role IN ('owner', 'admin', 'member')),
  is_active BOOLEAN DEFAULT true,
  is_temporary BOOLEAN DEFAULT false,  -- Para usuarios pre-creados
  email_verified BOOLEAN DEFAULT false,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Roles:**
- `owner`: Dueño de la organización (máximo control)
- `admin`: Administrador (puede gestionar usuarios y settings)
- `member`: Usuario regular (solo puede crear deliveries)

**Relaciones:**
- `N:1` → `organizations`
- `1:N` → `deliveries` (como sender)
- `1:N` → `invitations` (como invitador)

**Índices:**
- `idx_profiles_email` ON `email`
- `idx_profiles_org_id` ON `organization_id`

**Triggers:**
- `on_auth_user_created`: Auto-crea profile cuando usuario hace OAuth signup

---

### 3. `deliveries`
Tabla principal de entregas de archivos.

```sql
deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Datos de la entrega
  title TEXT NOT NULL,
  message TEXT,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,

  -- Configuración de seguridad
  password_hash TEXT,
  requires_authentication BOOLEAN DEFAULT true,

  -- Límites
  max_views INTEGER NOT NULL DEFAULT 10,
  max_downloads INTEGER NOT NULL DEFAULT 5,
  current_views INTEGER DEFAULT 0,
  current_downloads INTEGER DEFAULT 0,

  -- Expiración
  expires_at TIMESTAMPTZ NOT NULL,

  -- Estado
  status TEXT CHECK (status IN ('active', 'expired', 'revoked')) DEFAULT 'active',
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES profiles(id),
  revoked_reason TEXT,

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Estados:**
- `active`: Entrega activa y accesible
- `expired`: Expirada por tiempo o límites alcanzados
- `revoked`: Cancelada manualmente por el sender

**Relaciones:**
- `N:1` → `profiles` (sender)
- `N:1` → `organizations`
- `1:N` → `delivery_files` (archivos adjuntos)
- `1:N` → `access_logs` (logs de acceso)
- `1:N` → `delivery_access_codes` (códigos de verificación)

**Índices:**
- `idx_deliveries_sender` ON `sender_id`
- `idx_deliveries_org` ON `organization_id`
- `idx_deliveries_recipient` ON `recipient_email`
- `idx_deliveries_status` ON `status`
- `idx_deliveries_expires_at` ON `expires_at`

**Foreign Keys:**
- `deliveries_sender_id_fkey`: sender_id → profiles(id)
- `deliveries_organization_id_fkey`: organization_id → organizations(id)

---

### 4. `delivery_files`
Archivos adjuntos a cada delivery.

```sql
delivery_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,

  -- Información del archivo
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,

  -- Storage (AWS S3)
  s3_key TEXT NOT NULL,
  s3_bucket TEXT NOT NULL,

  -- Seguridad
  encryption_key TEXT,
  hash TEXT,  -- SHA-256 del archivo para verificación de integridad

  -- Metadata
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
)
```

**Relaciones:**
- `N:1` → `deliveries` (ON DELETE CASCADE)

**Índices:**
- `idx_delivery_files_delivery_id` ON `delivery_id`
- `idx_delivery_files_s3_key` ON `s3_key`

**Storage:**
- Archivos físicos en **AWS S3**
- `s3_key` formato: `deliveries/{delivery_id}/{file_id}/{filename}`

---

### 5. `access_logs`
Audit trail completo de todos los accesos a deliveries.

```sql
access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,

  -- Tipo de evento
  action TEXT NOT NULL CHECK (action IN (
    'view',
    'download',
    'access_attempt',
    'expired',
    'code_verified',
    'code_requested',
    'revoked'
  )),

  -- Resultado
  status TEXT CHECK (status IN ('success', 'failed', 'expired', 'revoked')),

  -- Información del acceso
  ip TEXT NOT NULL,
  location TEXT,  -- Geolocalización (ej: "Santiago, Chile")
  user_agent TEXT,

  -- Metadata adicional
  details TEXT,
  metadata JSONB,  -- { viewer_type: 'recipient' | 'sender', file_id, etc }

  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW()
)
```

**Tipos de acciones:**
- `view`: Visualización de la delivery (página de detalle)
- `download`: Descarga de archivo
- `access_attempt`: Intento de acceso (fallido o exitoso)
- `expired`: Delivery expirada
- `code_verified`: Código de verificación correcto
- `code_requested`: Código de verificación solicitado
- `revoked`: Delivery revocada

**Relaciones:**
- `N:1` → `deliveries` (ON DELETE CASCADE)

**Índices:**
- `idx_access_logs_delivery_id` ON `delivery_id`
- `idx_access_logs_timestamp` ON `timestamp`
- `idx_access_logs_action` ON `action`

**Uso:**
- Dashboard de Compliance
- Reportes PDF de auditoría
- Alertas de seguridad

---

## 🔐 Authentication & Authorization Tables

### 6. `invitations`
Sistema de invitaciones con token para unirse a organizaciones.

```sql
invitations (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID NOT NULL REFERENCES profiles(id),

  -- Token de invitación
  token TEXT NOT NULL UNIQUE,

  -- Estado
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')) DEFAULT 'pending',

  -- Expiración
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  metadata JSONB
)
```

**Relaciones:**
- `N:1` → `organizations`
- `N:1` → `profiles` (invited_by)

**Índices:**
- `idx_invitations_email` ON `email`
- `idx_invitations_token` ON `token`
- `idx_invitations_org` ON `organization_id`
- `idx_invitations_status` ON `status`

**Funciones:**
- `accept_invitation(token)`: Acepta invitación y asigna usuario a org

---

### 7. `organization_invitations`
Sistema de invitaciones SSO (sin token, auto-asignación).

```sql
organization_invitations (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Estado
  is_accepted BOOLEAN DEFAULT false,

  -- Timestamps
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Constraint
  UNIQUE(organization_id, email)
)
```

**Diferencia con `invitations`:**
- No usa token
- Auto-asigna cuando usuario hace SSO signup
- Más simple y directo para flujos OAuth

**Relaciones:**
- `N:1` → `organizations`
- `N:1` → `auth.users` (invited_by)

**Índices:**
- `idx_invitations_email` ON `email`
- `idx_invitations_org` ON `organization_id`
- `idx_invitations_pending` ON `is_accepted` WHERE `is_accepted = false`

**Triggers:**
- `on_invited_user_signup`: Auto-asigna usuario a org cuando hace signup

---

## 🔒 Security Tables

### 8. `delivery_access_codes`
Códigos de verificación de 6 dígitos para acceso seguro.

```sql
delivery_access_codes (
  id UUID PRIMARY KEY,
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,

  -- Código
  code VARCHAR(6) NOT NULL,
  recipient_email TEXT NOT NULL,

  -- Expiración
  expires_at TIMESTAMPTZ NOT NULL,

  -- Intentos
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Verificación
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Flujo:**
1. Usuario solicita acceso a delivery
2. Sistema genera código de 6 dígitos
3. Código enviado por email
4. Usuario ingresa código
5. Sistema verifica y registra `verified_at`
6. Después de `max_attempts` fallidos, código se bloquea

**Relaciones:**
- `N:1` → `deliveries` (ON DELETE CASCADE)

**Índices:**
- `idx_delivery_access_codes_delivery_id` ON `delivery_id`
- `idx_delivery_access_codes_code` ON `code`
- `idx_delivery_access_codes_expires_at` ON `expires_at`

---

## ⚙️ Configuration Tables

### 9. `organization_settings`
Configuración granular por organización.

```sql
organization_settings (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- ===== DELIVERY DEFAULTS =====
  default_max_views INTEGER DEFAULT 10,
  default_max_downloads INTEGER DEFAULT 5,
  default_expiration_hours INTEGER DEFAULT 24,
  default_require_authentication BOOLEAN DEFAULT true,

  -- ===== DELIVERY LIMITS =====
  max_views_limit INTEGER DEFAULT 1000,
  max_downloads_limit INTEGER DEFAULT 100,
  max_expiration_hours_limit INTEGER DEFAULT 720,  -- 30 días
  min_expiration_hours_limit INTEGER DEFAULT 1,

  -- ===== FILE RESTRICTIONS =====
  max_file_size_bytes BIGINT DEFAULT 314572800,  -- 300MB
  allowed_mime_types TEXT[] DEFAULT ARRAY[
    'application/pdf',
    'application/msword',
    'image/jpeg',
    'image/png',
    'application/zip',
    -- ... más tipos
  ],
  blocked_file_extensions TEXT[] DEFAULT ARRAY['.exe', '.bat', '.sh'],

  -- ===== AI COMPLIANCE SETTINGS =====
  ai_compliance_enabled BOOLEAN DEFAULT false,
  ai_provider VARCHAR(50) DEFAULT 'gemini',  -- 'gemini' | 'openai' | 'claude'
  ai_scan_pii BOOLEAN DEFAULT true,
  ai_scan_phi BOOLEAN DEFAULT true,
  ai_scan_financial BOOLEAN DEFAULT true,
  ai_scan_code_secrets BOOLEAN DEFAULT true,
  ai_scan_images_ocr BOOLEAN DEFAULT false,
  ai_regulations TEXT[] DEFAULT ARRAY['GDPR', 'HIPAA', 'CCPA'],
  ai_block_on_critical BOOLEAN DEFAULT false,
  ai_alert_on_high BOOLEAN DEFAULT true,
  ai_alert_on_medium BOOLEAN DEFAULT false,
  ai_max_scans_per_month INTEGER,  -- NULL = unlimited
  ai_scan_timeout_seconds INTEGER DEFAULT 30,

  -- ===== SECURITY FEATURES =====
  allow_password_protection BOOLEAN DEFAULT true,
  require_recipient_verification BOOLEAN DEFAULT true,
  allow_anonymous_delivery BOOLEAN DEFAULT false,
  require_access_code BOOLEAN DEFAULT true,
  access_code_expiration_minutes INTEGER DEFAULT 15,
  max_access_code_attempts INTEGER DEFAULT 3,

  -- ===== ACCESS CONTROL =====
  enable_email_whitelist BOOLEAN DEFAULT false,
  enable_email_blacklist BOOLEAN DEFAULT false,
  enable_ip_whitelist BOOLEAN DEFAULT false,
  enable_ip_blacklist BOOLEAN DEFAULT false,
  enable_domain_restriction BOOLEAN DEFAULT false,

  -- ===== AUDIT & COMPLIANCE =====
  enable_audit_trail BOOLEAN DEFAULT true,
  enable_digital_signatures BOOLEAN DEFAULT false,
  enable_custody_chain BOOLEAN DEFAULT false,
  retention_policy_days INTEGER,  -- NULL = indefinite
  auto_delete_on_expiration BOOLEAN DEFAULT true,

  -- ===== NOTIFICATIONS =====
  notify_on_delivery_view BOOLEAN DEFAULT false,
  notify_on_delivery_download BOOLEAN DEFAULT true,
  notify_on_delivery_expired BOOLEAN DEFAULT false,
  notify_on_high_risk_content BOOLEAN DEFAULT true,
  notify_on_access_denied BOOLEAN DEFAULT true,

  -- ===== METADATA =====
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),

  CONSTRAINT unique_org_settings UNIQUE(organization_id)
)
```

**Relaciones:**
- `1:1` → `organizations`

**Índices:**
- `idx_org_settings_org_id` ON `organization_id`
- `idx_org_settings_ai_enabled` ON `ai_compliance_enabled`

**Triggers:**
- `trigger_update_organization_settings_updated_at`: Auto-actualiza `updated_at`

**Funciones:**
- `get_organization_settings(org_id)`: Helper para obtener settings
- `validate_delivery_limits(org_id, views, downloads, hours)`: Validación

---

## 📐 Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│  organizations  │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴────────────────────────────────┐
    │                                     │
    │                                     │
┌───▼──────┐                    ┌─────────▼────────┐
│ profiles │                    │    deliveries    │
└───┬──────┘                    └────────┬─────────┘
    │                                    │
    │ 1:N                                │ 1:N
    │                                    │
┌───▼──────────┐              ┌─────────▼──────────┐
│  invitations │              │  delivery_files    │
└──────────────┘              └────────────────────┘
                                         │
                              ┌──────────┼──────────┐
                              │          │          │
                    ┌─────────▼──┐  ┌───▼────┐  ┌──▼───────┐
                    │access_logs │  │ codes  │  │   AWS    │
                    └────────────┘  └────────┘  │    S3    │
                                                └──────────┘

┌─────────────────────────┐
│ organization_settings   │  (1:1 con organizations)
└─────────────────────────┘

┌──────────────────────────┐
│ organization_invitations │  (1:N con organizations)
└──────────────────────────┘
```

---

## 🔐 Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Políticas principales:

### Organizations
- ✅ Usuarios pueden ver su propia organización
- ✅ Solo service_role puede crear organizaciones

### Profiles
- ✅ Usuarios pueden ver su propio perfil
- ✅ Admins pueden ver perfiles de su organización
- ✅ Usuarios pueden actualizar su propio perfil

### Deliveries
- ✅ Users can view own deliveries
- ✅ Admins can view organization deliveries
- ✅ Users can insert deliveries for their org
- ✅ Users can update/delete own deliveries
- ✅ Public can view active deliveries (para recipients)

### Access Logs
- ✅ Public read (necesario para verificación)
- ✅ Service can insert

### Organization Settings
- ✅ Users can read their org settings
- ✅ Admins can update org settings
- ✅ Service role full access

### Invitations
- ✅ Users can view invitations sent to their email
- ✅ Admins can view/create/update org invitations

---

## 🔧 Database Functions

### Authentication
- `handle_new_user()`: Auto-crea profile en OAuth signup
- `accept_invitation(token)`: Acepta invitación y asigna a org
- `handle_invited_user_signup()`: Auto-asigna usuario SSO invitado

### Settings
- `get_organization_settings(org_id)`: Obtiene settings
- `validate_delivery_limits(...)`: Valida límites antes de crear delivery
- `update_organization_settings_updated_at()`: Auto-actualiza timestamp

---

## 📊 Indexes Strategy

### Performance Indexes
- Todos los foreign keys tienen índices
- Campos de búsqueda frecuente (email, status, timestamps)
- Campos de filtrado en queries (organization_id, sender_id)

### Unique Constraints
- `profiles.email` (UNIQUE)
- `organizations.slug` (UNIQUE)
- `invitations.token` (UNIQUE)
- `organization_invitations(organization_id, email)` (UNIQUE compuesto)
- `organization_settings.organization_id` (UNIQUE)

---

## 🔄 Triggers

| Tabla | Trigger | Función | Descripción |
|-------|---------|---------|-------------|
| `auth.users` | `on_auth_user_created` | `handle_new_user()` | Crea profile automático en OAuth |
| `profiles` | `on_invited_user_signup` | `handle_invited_user_signup()` | Auto-asigna invitados SSO |
| `organization_settings` | `trigger_update_...` | `update_...updated_at()` | Actualiza timestamp |

---

## 📈 Data Flow Examples

### Crear Delivery
```
1. User hace POST /api/deliveries
2. API valida con validate_delivery_limits()
3. Se crea row en deliveries
4. Se suben archivos a S3
5. Se crean rows en delivery_files
6. Se registra access_log con action='created'
7. Se envía email al recipient con link
```

### Acceder a Delivery (Recipient)
```
1. Recipient abre link
2. Sistema verifica si delivery está active
3. Se genera código de 6 dígitos
4. Se crea row en delivery_access_codes
5. Se envía código por email
6. Recipient ingresa código
7. Sistema verifica código
8. Si correcto: marca verified_at
9. Se registra access_log con action='view'
10. Se incrementa current_views en delivery
11. Recipient puede descargar archivos
12. Se registra access_log con action='download'
13. Se incrementa current_downloads
```

### Invitar Usuario (SSO)
```
1. Admin hace POST /api/organization/members
2. API verifica si email existe en auth.users
3. Si NO existe:
   - Crea row en organization_invitations
   - Envía email de notificación
4. Usuario hace login con Google SSO
5. Trigger on_invited_user_signup se ejecuta
6. Busca invitation pendiente por email
7. Si encuentra: actualiza profile con org_id y role
8. Marca invitation como accepted
```

---

## 🎯 Performance Considerations

### Optimizaciones
- **Cascade deletes**: deliveries → files, access_logs, codes
- **Indexes compuestos**: Para queries frecuentes
- **JSONB columns**: Para metadata flexible sin schemas rígidos
- **Timestamp indexes**: Para rangos de fechas en reportes

### Queries pesadas
- Dashboard de compliance: Agrega miles de access_logs
- Reportes PDF: Lee últimos 50 access_logs
- Stats de organización: Cuenta deliveries por estado

### Caching strategy
- organization_settings: Cache de 5 minutos
- Delivery details: No cache (datos en tiempo real)
- Access logs: Write-heavy, read ocasional

---

## 🔮 Future Enhancements

### Tablas planeadas
- [ ] `email_whitelist` / `email_blacklist`
- [ ] `ip_whitelist` / `ip_blacklist`
- [ ] `compliance_scans` (resultados de AI scanning)
- [ ] `webhook_events` (para integraciones)
- [ ] `api_keys` (para API pública)
- [ ] `billing_plans` / `subscriptions`

### Mejoras planeadas
- [ ] Particionamiento de access_logs por fecha
- [ ] Archivado de deliveries antiguas
- [ ] Replicación read-only para reportes
- [ ] Full-text search en deliveries

---

## 📞 Support

Para preguntas sobre el schema:
1. Revisar este documento
2. Consultar migraciones en `supabase/migrations/`
3. Ver tipos TypeScript en `src/features/*/types/`

**Migraciones aplicadas:**
- `001_oauth_setup.sql` - OAuth + invitaciones
- `002_add_hash_to_delivery_files.sql` - Hash SHA-256
- `003_add_uuid_default_to_deliveries.sql` - UUIDs automáticos
- `004_add_delivery_access_codes.sql` - Códigos de verificación
- `005_add_public_delivery_access.sql` - Acceso público
- `006_add_access_codes_policies.sql` - RLS para códigos
- `006_organization_settings.sql` - Settings centralizados
- `007_add_domain_to_organizations.sql` - Dominio verificado
- `008_organization_invitations.sql` - Invitaciones SSO

---

**Last Updated**: November 2024
**Maintainer**: Claude Code
**Version**: 1.0
