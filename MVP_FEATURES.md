# Sealdrop MVP - Feature Scope

**Target Market**: Nicho legal e inmobiliario en Chile
**MVP Goal**: Validar el producto con features core esenciales
**Launch Date**: Q1 2025

---

## ✅ Features INCLUIDAS en MVP

### 🔐 Core Security Features

1. **Auto-Destruction** ⭐ (Valor diferenciador #1)
   - Archivos se eliminan automáticamente después de:
     - Tiempo de expiración configurable
     - Número máximo de vistas alcanzado
     - Número máximo de descargas alcanzado
   - Eliminación física de S3

2. **Two-Factor Authentication (2FA)**
   - Código de 6 dígitos enviado por email
   - Expira en 15 minutos
   - Máximo 3 intentos fallidos
   - Obligatorio para acceder a archivos

3. **Password Protection** (Opcional)
   - Los senders pueden agregar contraseña adicional
   - Hash con bcrypt
   - Doble capa de seguridad (2FA + password)

4. **Access Control**
   - Max views (default: 10)
   - Max downloads (default: 5)
   - Expiration time (default: 24 horas)
   - Contador automático de accesos

### 📊 Audit & Compliance

5. **Complete Audit Trail** ⭐ (Valor diferenciador #2)
   - Registro de todos los eventos:
     - `view`: Visualización de delivery
     - `download`: Descarga de archivo
     - `access_attempt`: Intento de acceso
     - `code_verified`: Código 2FA correcto
     - `code_requested`: Solicitud de código
     - `expired`: Delivery expirada
     - `revoked`: Cancelación manual
   - Metadata de cada evento:
     - IP address
     - Geolocalización (ciudad, país)
     - User agent (navegador/OS)
     - Timestamp exacto
   - Export to PDF para reportes de compliance

6. **Real-time Dashboard**
   - Ver deliveries activas/expiradas
   - Estadísticas de accesos
   - Timeline de eventos
   - Revocar deliveries manualmente

### 🚀 Core Functionality

7. **Secure File Upload**
   - Múltiples archivos por delivery
   - Hasta 300MB por archivo
   - Almacenamiento cifrado en AWS S3
   - Hash SHA-256 para verificación de integridad
   - Preview de archivos (PDF, imágenes)

8. **Email Notifications**
   - Recipient recibe link de acceso
   - Código 2FA por email separado
   - Sender recibe alertas de accesos
   - Notificaciones de expiración

9. **Multi-tenant con Roles**
   - Owner: Control total
   - Admin: Gestión de usuarios y settings
   - Member: Solo crear deliveries
   - Invitaciones vía email SSO

### 💰 Subscription System

10. **3 Planes de Pago** (Lemon Squeezy)
    - **Early Adopter**: Free forever (50 primeros usuarios)
      - 10 deliveries/mes
      - 500 MB storage
      - 1 usuario
    - **Starter**: $19/mes
      - 50 deliveries/mes
      - 10 GB storage
      - 5 usuarios
    - **Pro**: $49/mes
      - 500 deliveries/mes
      - 50 GB storage
      - 20 usuarios
    - **Enterprise**: Custom pricing
      - Unlimited deliveries
      - 500 GB storage
      - Unlimited usuarios

11. **Subscription Enforcement**
    - Límite de deliveries por mes (enforced)
    - Upgrade/downgrade automático vía webhook
    - Payment failed handling
    - Customer portal para gestión

### 🎨 User Experience

12. **Simple Onboarding**
    - Google OAuth SSO
    - Solo pide nombre de organización
    - Dashboard disponible de inmediato
    - Tutorial opcional

13. **Responsive Design**
    - Mobile-friendly
    - Dark mode ready
    - Sidebar navigation
    - Toast notifications

---

## ❌ Features NO INCLUIDAS en MVP (Para Después)

### 🚫 Removed from MVP - Too Complex

1. **Domain Validation** ❌
   - **Por qué no**: Abogados e inmobiliarias envían archivos a clientes externos (que tienen emails personales como @gmail.com)
   - **No tiene sentido** validar dominios corporativos

2. **Email Whitelist/Blacklist** ❌
   - **Por qué no**: Limita el uso real del producto
   - Cada delivery va a un cliente diferente

3. **IP Whitelist/Blacklist** ❌
   - **Por qué no**: Demasiado técnico para el target
   - Los usuarios no saben qué es una IP

4. **Custom Branding** ❌
   - Logo personalizado
   - Colores de marca
   - **Por qué no**: Nice to have, no crítico para MVP
   - **Para después**: Cobrar como feature premium

5. **AI Compliance Scanning** ❌
   - Detección de PII, PHI, datos financieros
   - OCR de imágenes
   - **Por qué no**:
     - Muy costoso (API calls)
     - Complejo de implementar bien
     - No diferenciador inicial
   - **Para después**: Feature premium (AI Pro Plan)

6. **Digital Signatures** ❌
   - Firma electrónica de documentos
   - **Por qué no**: Complejo de hacer bien (requiere certificados, PKI)
   - **Para después**: Integración con DocuSign o SignNow

7. **Chain of Custody** ❌
   - Tracking de custodia legal de archivos
   - **Por qué no**: Feature muy específica para abogados
   - **Para después**: Validar si realmente se necesita

8. **API Access** ❌
   - REST API pública
   - Webhooks
   - **Por qué no**: Nadie lo va a usar al principio
   - **Para después**: Cuando haya demanda de integraciones

9. **Webhooks for Integrations** ❌
   - Slack, Teams, Zapier
   - **Por qué no**: No hay integraciones configuradas aún
   - **Para después**: Después del MVP validado

10. **Advanced Analytics** ❌
    - Gráficos de tendencias
    - Heatmaps de accesos
    - Predictive analytics
    - **Por qué no**: Nice to have
    - **Para después**: Feature premium

11. **Bulk Operations** ❌
    - Envío masivo de deliveries
    - Templates de deliveries
    - **Por qué no**: No es el caso de uso principal
    - **Para después**: Si hay demanda

12. **Anonymous Deliveries** ❌
    - Enviar sin requerir 2FA
    - **Por qué no**: Va contra la seguridad
    - El MVP es "secure by default"

---

## 🔄 Features Simplificadas para MVP

### 1. Onboarding
- **Antes**: Pedir nombre, dominio, website, logo
- **Ahora**: Solo nombre de organización
- **Razón**: Reducir fricción, comenzar más rápido

### 2. Organization Settings
- **Antes**: 40+ configuraciones
- **Ahora**: ~15 configuraciones core
- **Razón**: Menos es más para MVP

### 3. Subscription Plans
- **Antes**: Considerar features como AI, API, branding
- **Ahora**: Solo límites de deliveries/storage/usuarios
- **Razón**: Simplificar pricing y value proposition

---

## 📊 MVP Success Metrics

### Validation Goals (3 meses)

1. **Adoption**
   - 50 early adopters registrados
   - 20+ organizaciones pagando (Starter/Pro)
   - 80% retention después de primer mes

2. **Usage**
   - 500+ deliveries creadas
   - 1000+ archivos enviados
   - 5000+ accesos tracked

3. **Feedback**
   - NPS score > 40
   - 10+ testimonios positivos
   - 0 incidentes de seguridad

4. **Revenue**
   - MRR de $500+ USD
   - CAC < $50
   - LTV > $300

---

## 🚀 Post-MVP Roadmap (Q2 2025)

### Phase 1: Premium Features
1. Custom branding
2. Advanced analytics
3. Bulk send
4. Templates

### Phase 2: Integrations
1. Slack/Teams notifications
2. Zapier integration
3. Public REST API
4. Webhooks

### Phase 3: AI & Advanced
1. AI compliance scanning
2. PII/PHI detection
3. Document classification
4. Smart expiration (ML-based)

### Phase 4: Enterprise
1. SAML SSO
2. Custom contracts
3. Dedicated support
4. SLA guarantees

---

## 💡 Key Decisions for MVP

### ✅ Keep Simple
- Solo Google OAuth (no email/password)
- Solo 2FA por email (no SMS)
- Solo AWS S3 (no multi-cloud)
- Solo Lemon Squeezy (no Stripe)

### ✅ Focus on Security
- Auto-destruction es el diferenciador #1
- Audit trail es el diferenciador #2
- Todo lo demás es secundario

### ✅ Target Specific Niches
- Abogados (contratos, documentos legales)
- Inmobiliarias (contratos de compraventa, escrituras)
- Estos nichos NECESITAN:
  - Compliance
  - Audit trails
  - Seguridad
  - Simplicidad

### ✅ Price for Value
- Early adopters: FREE forever (50 usuarios)
- Starter: $19/mes (competitivo)
- Pro: $49/mes (ROI claro)
- Enterprise: Custom (high-touch sales)

---

## 📝 Technical Debt Accepted for MVP

1. **No multi-region S3**: Solo us-east-1 (latencia aceptable para Chile)
2. **No CDN for files**: Descargas directas desde S3 (más simple)
3. **No background jobs**: Cron manual vía API route (suficiente para MVP)
4. **No real-time updates**: Polling cada 30s (más simple que WebSockets)
5. **No E2E tests**: Solo unit tests críticos (faster iteration)

---

## 🎯 MVP Launch Checklist

- [x] Core security features implementadas
- [x] Audit trail completo
- [x] Subscription system con Lemon Squeezy
- [x] Onboarding simplificado
- [ ] Migración 011 aplicada (simplify MVP)
- [ ] Tests E2E de flujo crítico
- [ ] Deploy a producción (Vercel)
- [ ] Configurar Lemon Squeezy en producción
- [ ] Configurar emails transaccionales
- [ ] Documentación de usuario (Help page)
- [ ] Landing page actualizada
- [ ] Campaña de lanzamiento (primeros 50 usuarios)

---

**Última actualización**: Noviembre 2024
**Próxima revisión**: Después de lanzamiento MVP
