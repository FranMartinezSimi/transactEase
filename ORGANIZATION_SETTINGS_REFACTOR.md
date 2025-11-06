# 🏢 Organization-Centric Settings Refactoring Plan

## 📌 Executive Summary

**Objetivo:** Mover todas las configuraciones hardcoded a nivel de organización, permitiendo que cada org configure:
- Límites de delivery (max views, downloads, expiration)
- AI Compliance settings
- File restrictions
- Security features
- Notifications

**Status:** ✅ Database + Services completados | 🚧 UI pendiente

---

## 🎯 Problema Actual

### ❌ Hard-coded Values
```typescript
// src/shared/utils/validations/delivery.ts
maxViews: z.number().min(1).max(1000).default(10),  // FIXED
maxDownloads: z.number().min(1).max(100).default(5), // FIXED
expiresIn: z.enum(["1h", "24h", "7d", "30d"]),      // FIXED
```

### ❌ Inconsistencia
- `organizations` table tiene campos (`max_views`, `max_downloads`) pero no se usan
- Cada delivery usa valores por defecto globales
- No hay forma de que una org personalice sus límites

---

## ✅ Solución: organization_settings Table

### Nueva Tabla Centralizada

```sql
organization_settings (
  -- Delivery Defaults (usados cuando se crea delivery)
  default_max_views: 10
  default_max_downloads: 5
  default_expiration_hours: 24

  -- Delivery Limits (lo MÁXIMO que puede configurar el user)
  max_views_limit: 1000
  max_downloads_limit: 100
  max_expiration_hours_limit: 720  -- 30 días
  min_expiration_hours_limit: 1

  -- AI Compliance
  ai_compliance_enabled: false
  ai_provider: 'gemini' | 'openai' | 'claude'
  ai_scan_pii: true
  ai_scan_phi: true
  ai_scan_financial: true
  ai_scan_code_secrets: true
  ai_scan_images_ocr: false
  ai_regulations: ['GDPR', 'HIPAA', 'CCPA']
  ai_block_on_critical: false
  ai_alert_on_high: true
  ai_max_scans_per_month: NULL  -- unlimited

  -- File Restrictions
  max_file_size_bytes: 314572800  -- 300MB
  allowed_mime_types: [...]
  blocked_file_extensions: ['.exe', '.bat']

  -- Security Features
  require_recipient_verification: true
  require_access_code: true
  access_code_expiration_minutes: 15
  max_access_code_attempts: 3

  -- Notifications
  notify_on_delivery_download: true
  notify_on_high_risk_content: true
  ...
)
```

---

## 📋 Implementación por Fases

### ✅ Fase 1: Database & Services (COMPLETADO)

**Archivos creados:**
- ✅ `supabase/migrations/006_organization_settings.sql`
- ✅ `src/features/organization/types/settings.interface.ts`
- ✅ `src/features/organization/services/organization-settings.service.ts`
- ✅ `src/shared/utils/case-converter.ts`

**Funcionalidad:**
- RPC function `validate_delivery_limits()` en PostgreSQL
- Service con métodos:
  - `getSettings(orgId)`
  - `updateSettings(orgId, updates)`
  - `getDeliveryLimits(orgId)`
  - `getAIComplianceConfig(orgId)`
  - `validateDeliveryLimits(orgId, maxViews, maxDownloads, expHours)`
  - `isFileTypeAllowed(orgId, mimeType, filename)`
  - `shouldRunAICompliance(orgId)`

---

### 🚧 Fase 2: Update Delivery Flow (PRÓXIMO)

#### 2.1 Update Validation Schemas

**Archivo:** `src/shared/utils/validations/delivery.ts`

**Antes:**
```typescript
maxViews: z.number().min(1).max(1000).default(10),
```

**Después:**
```typescript
// Validation ahora es dinámica basada en org settings
export function createDeliverySchemaForOrg(limits: DeliveryLimits) {
  return z.object({
    maxViews: z.number()
      .min(1)
      .max(limits.maxViews.max)
      .default(limits.maxViews.default),

    maxDownloads: z.number()
      .min(1)
      .max(limits.maxDownloads.max)
      .default(limits.maxDownloads.default),

    expirationHours: z.number()
      .min(limits.expirationHours.min)
      .max(limits.expirationHours.max)
      .default(limits.expirationHours.default),
  });
}
```

#### 2.2 Update Upload Endpoint

**Archivo:** `src/app/api/deliveries/upload/route.ts`

**Cambios:**
```typescript
async function uploadHandler(req: NextRequest) {
  const supabase = await createClient();
  const orgSettingsService = new OrganizationSettingsService(supabase);

  // 1. Get organization settings
  const orgSettings = await orgSettingsService.getSettings(organizationId);

  // 2. Get dynamic limits
  const limits = await orgSettingsService.getDeliveryLimits(organizationId);

  // 3. Validate delivery parameters
  const validation = await orgSettingsService.validateDeliveryLimits(
    organizationId,
    maxViews,
    maxDownloads,
    expirationHours
  );

  if (!validation.valid) {
    return NextResponse.json(
      { message: validation.errorMessage },
      { status: 400 }
    );
  }

  // 4. Check file type
  const fileAllowed = await orgSettingsService.isFileTypeAllowed(
    organizationId,
    file.type,
    file.name
  );

  if (!fileAllowed) {
    return NextResponse.json(
      { message: "File type not allowed by organization policy" },
      { status: 400 }
    );
  }

  // 5. Check file size
  const sizeAllowed = await orgSettingsService.isFileSizeAllowed(
    organizationId,
    file.size
  );

  if (!sizeAllowed) {
    return NextResponse.json(
      { message: "File size exceeds organization limit" },
      { status: 400 }
    );
  }

  // 6. Upload file...

  // 7. AI Compliance check
  const shouldScan = await orgSettingsService.shouldRunAICompliance(organizationId);

  if (shouldScan) {
    const aiConfig = await orgSettingsService.getAIComplianceConfig(organizationId);

    const orchestrator = new ComplianceOrchestratorService();
    const scanResult = await orchestrator.analyzeFile(
      buffer,
      file.type,
      file.name,
      {
        scanTypes: aiConfig.scanTypes,
        regulations: aiConfig.regulations,
        provider: aiConfig.provider,
        timeout: aiConfig.limits.timeoutSeconds,
      }
    );

    // Save scan result
    await supabase.from("compliance_scans").insert({
      delivery_id: deliveryId,
      organization_id: organizationId,
      scan_result: scanResult,
      scan_provider: aiConfig.provider,
    });

    // Block if critical and configured to block
    if (scanResult.riskLevel === "critical" && aiConfig.behavior.blockOnCritical) {
      // Delete uploaded file
      await deleteFromS3(storagePath);

      return NextResponse.json(
        {
          message: "Delivery blocked due to critical compliance risk",
          findings: scanResult.findings,
        },
        { status: 403 }
      );
    }

    // Alert if high/medium risk
    if (
      (scanResult.riskLevel === "high" && aiConfig.behavior.alertOnHigh) ||
      (scanResult.riskLevel === "medium" && aiConfig.behavior.alertOnMedium)
    ) {
      await sendComplianceAlert({
        organizationId,
        userId: user.id,
        deliveryId,
        riskLevel: scanResult.riskLevel,
        findings: scanResult.findings,
      });
    }
  }

  // Continue with delivery creation...
}
```

#### 2.3 Update Frontend Form

**Archivo:** `src/app/delivery/page.tsx`

**Fetch limits on mount:**
```typescript
const [orgLimits, setOrgLimits] = useState<DeliveryLimits | null>(null);

useEffect(() => {
  async function fetchLimits() {
    const response = await fetch("/api/organization/settings/limits");
    const limits = await response.json();
    setOrgLimits(limits);
  }
  fetchLimits();
}, []);

// Use dynamic limits in form
<input
  type="number"
  min={1}
  max={orgLimits?.maxViews.max || 1000}
  defaultValue={orgLimits?.maxViews.default || 10}
/>
```

---

### 🎨 Fase 3: Settings UI (1-2 días)

#### 3.1 Create Settings Page

**Archivo:** `src/app/settings/organization/page.tsx`

**Sections:**
1. **Delivery Defaults**
   - Default max views
   - Default max downloads
   - Default expiration time

2. **Delivery Limits**
   - Maximum max views a user can set
   - Maximum max downloads
   - Max/min expiration hours

3. **AI Compliance**
   - Enable/disable toggle
   - Choose provider (Gemini/OpenAI/Claude)
   - Select scan types (PII, PHI, Financial, Code)
   - Choose regulations (GDPR, HIPAA, CCPA)
   - Behavior on risk detection
   - Monthly scan limit

4. **File Restrictions**
   - Max file size
   - Allowed/blocked file types
   - Blocked extensions

5. **Security Features**
   - Require recipient verification
   - Access code settings
   - Password protection

6. **Notifications**
   - Email alerts configuration

#### 3.2 Create API Endpoints

```typescript
// GET /api/organization/settings
export async function GET(req: NextRequest) {
  const orgSettingsService = new OrganizationSettingsService(supabase);
  const settings = await orgSettingsService.getSettings(organizationId);
  return NextResponse.json(settings);
}

// PUT /api/organization/settings
export async function PUT(req: NextRequest) {
  const updates = await req.json();
  const orgSettingsService = new OrganizationSettingsService(supabase);
  const updated = await orgSettingsService.updateSettings(
    organizationId,
    updates,
    user.id
  );
  return NextResponse.json(updated);
}

// GET /api/organization/settings/limits (for frontend form)
export async function GET(req: NextRequest) {
  const orgSettingsService = new OrganizationSettingsService(supabase);
  const limits = await orgSettingsService.getDeliveryLimits(organizationId);
  return NextResponse.json(limits);
}
```

---

## 📊 Diagrama de Flujo

### Creación de Delivery (Nuevo)

```
User fills form
  ↓
Frontend fetches org limits (GET /api/organization/settings/limits)
  ↓
Form validates against org limits (client-side)
  ↓
Submit → POST /api/deliveries/upload
  ↓
Backend:
  1. Get org settings
  2. Validate limits (DB function validate_delivery_limits)
  3. Check file type allowed
  4. Check file size allowed
  5. Upload to S3
  6. Check if AI compliance enabled
  7. If yes → Run AI scan
  8. If critical risk + block enabled → Delete file + return error
  9. If high/medium risk + alert enabled → Send notification
  10. Create delivery record
  ↓
Return success
```

---

## 🔄 Migration Strategy

### Para Organizaciones Existentes

**Script:** `scripts/migrate-to-org-settings.ts`

```typescript
async function migrateExistingOrganizations() {
  const { data: orgs } = await supabase.from("organizations").select("id");

  for (const org of orgs) {
    // Create default settings if not exist
    await supabase.from("organization_settings").insert({
      organization_id: org.id,
      // Use DEFAULT values from migration
    }).onConflict("organization_id").ignore();
  }

  console.log(`Migrated ${orgs.length} organizations`);
}
```

**Ejecutar:**
```bash
npx tsx scripts/migrate-to-org-settings.ts
```

---

## 🎯 Beneficios

### Para el Negocio
- ✅ **Personalización por cliente:** Cada org configura sus límites
- ✅ **Upselling:** Free plan: 10 deliveries/mes, Pro plan: 1000 deliveries/mes
- ✅ **Compliance configurable:** Org elige qué regulaciones aplicar
- ✅ **Seguridad granular:** Control fino por organización

### Para el Código
- ✅ **No más hard-coding:** Todo configurable
- ✅ **Validación en DB:** PostgreSQL valida límites
- ✅ **Escalable:** Agregar nuevas configs es fácil
- ✅ **Auditable:** Logs de cambios en settings

---

## 📈 Roadmap

| Fase | Tarea | Estado | Tiempo |
|------|-------|--------|---------|
| 1 | Database migration | ✅ | 1h |
| 1 | TypeScript types | ✅ | 30min |
| 1 | Service layer | ✅ | 1h |
| 2 | Update validation schemas | 🚧 | 1h |
| 2 | Update upload endpoint | 🚧 | 2h |
| 2 | Update frontend form | 🚧 | 1h |
| 3 | Settings UI page | ⏳ | 4h |
| 3 | Settings API endpoints | ⏳ | 2h |
| 4 | Testing | ⏳ | 4h |
| 4 | Documentation | ⏳ | 2h |

**Total estimado:** 18-20 horas

---

## 🔒 Security Considerations

### RLS Policies
- ✅ Users can read their org settings
- ✅ Only admins/owners can update settings
- ✅ Service role has full access

### Validation
- ✅ DB-level validation (`validate_delivery_limits` function)
- ✅ Backend validation (service layer)
- ✅ Frontend validation (UX)

### Audit Trail
- ✅ `updated_by` field tracks who changed settings
- ✅ `updated_at` timestamp
- ✅ Can add changelog table if needed

---

## 🚀 Next Steps

1. **Run migration:**
   ```bash
   supabase db push
   ```

2. **Test service in console:**
   ```typescript
   const service = new OrganizationSettingsService(supabase);
   const settings = await service.getSettings("org-id");
   console.log(settings);
   ```

3. **Update upload endpoint** (Fase 2)

4. **Create settings UI** (Fase 3)

---

## 📞 Questions?

- **¿Qué pasa si una org no tiene settings?** → Se crean automáticamente con defaults
- **¿Los cambios afectan deliveries existentes?** → No, solo nuevas deliveries
- **¿Puedo migrar deliveries antiguas?** → Sí, pero hay que evaluar caso por caso
- **¿Cómo habilitar AI para una org?** → UPDATE organization_settings SET ai_compliance_enabled = true

---

**Status:** ✅ Ready for Phase 2
**Next:** Update upload endpoint to use org settings
