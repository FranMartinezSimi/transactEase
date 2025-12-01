# Lemon Squeezy Setup Guide

Guía completa para configurar Lemon Squeezy como medio de pago en Sealdrop.

---

## 📋 Requisitos Previos

- Cuenta en [Lemon Squeezy](https://lemonsqueezy.com)
- Store creado en Lemon Squeezy
- Acceso a las variables de entorno del proyecto

---

## 🚀 Paso 1: Crear Cuenta y Store en Lemon Squeezy

1. Ir a https://lemonsqueezy.com y crear cuenta
2. Completar el onboarding y crear tu "Store"
3. Ir a **Settings → General** y copiar tu **Store ID**

---

## 🔑 Paso 2: Obtener API Key

1. Ir a **Settings → API**
2. Click en **Create API Key**
3. Darle un nombre (ej: "Sealdrop Production")
4. Copiar el API Key generado

⚠️ **Importante**: Esta key solo se muestra una vez. Guárdala de forma segura.

---

## 📦 Paso 3: Crear Productos y Variants

Necesitas crear 3 productos (o 1 producto con 3 variants):

### Opción A: 3 Productos separados (Recomendado)

1. Ir a **Products → Add Product**
2. Crear cada producto:

#### Producto 1: Starter Plan
- **Name**: Sealdrop Starter
- **Description**: Perfect for small teams
- **Price**: $19/month (recurring)
- **Variant Name**: Monthly Subscription

#### Producto 2: Pro Plan
- **Name**: Sealdrop Pro
- **Description**: For growing teams
- **Price**: $49/month (recurring)
- **Variant Name**: Monthly Subscription

#### Producto 3: Enterprise Plan
- **Name**: Sealdrop Enterprise
- **Description**: Custom enterprise solution
- **Price**: Custom (contact sales)
- **Variant Name**: Enterprise License

3. Copiar los **Variant IDs** de cada producto (ver en la URL o en la configuración del variant)

### Opción B: 1 Producto con 3 Variants

1. Crear un producto "Sealdrop"
2. Agregar 3 variants con precios diferentes
3. Copiar los 3 Variant IDs

---

## 🔗 Paso 4: Configurar Webhook

1. Ir a **Settings → Webhooks**
2. Click en **+ Add Webhook**
3. Configurar:
   - **URL**: `https://tudominio.com/api/webhooks/lemonsqueezy`
   - **Events**: Seleccionar todos los eventos de `subscription_*`:
     - `subscription_created`
     - `subscription_updated`
     - `subscription_cancelled`
     - `subscription_resumed`
     - `subscription_expired`
     - `subscription_paused`
     - `subscription_unpaused`
     - `subscription_payment_failed`
     - `subscription_payment_success`
   - **Status**: Active

4. Copiar el **Signing Secret** generado

---

## ⚙️ Paso 5: Configurar Variables de Entorno

Agregar las siguientes variables a tu `.env.local`:

```env
# Lemon Squeezy
LEMONSQUEEZY_API_KEY=lsapi_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LEMONSQUEEZY_STORE_ID=12345
LEMONSQUEEZY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Lemon Squeezy Product/Variant IDs
LEMONSQUEEZY_STARTER_VARIANT_ID=123456
LEMONSQUEEZY_PRO_VARIANT_ID=123457
LEMONSQUEEZY_ENTERPRISE_VARIANT_ID=123458
```

### Dónde obtener cada valor:

| Variable | Dónde encontrarla |
|----------|-------------------|
| `LEMONSQUEEZY_API_KEY` | Settings → API → Create API Key |
| `LEMONSQUEEZY_STORE_ID` | Settings → General → Store ID |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Settings → Webhooks → Signing Secret |
| `LEMONSQUEEZY_STARTER_VARIANT_ID` | Products → Starter → Variant → ID (en la URL) |
| `LEMONSQUEEZY_PRO_VARIANT_ID` | Products → Pro → Variant → ID (en la URL) |
| `LEMONSQUEEZY_ENTERPRISE_VARIANT_ID` | Products → Enterprise → Variant → ID (en la URL) |

---

## 🧪 Paso 6: Probar en Modo Test

Lemon Squeezy tiene un modo de prueba:

1. Ir a **Settings → General → Test Mode**
2. Activar **Test Mode**
3. Realizar una compra de prueba:
   - Ir a `/pricing` en tu app
   - Click en "Get Started" en cualquier plan
   - Usar tarjeta de prueba: `4242 4242 4242 4242`
   - Completar checkout

4. Verificar:
   - ✅ Webhook recibido en `/api/webhooks/lemonsqueezy`
   - ✅ Subscription creada en la base de datos
   - ✅ Plan actualizado correctamente

---

## 🌐 Paso 7: Configurar Dominio Personalizado (Opcional)

Por defecto, Lemon Squeezy usa sus propias URLs de checkout. Para usar tu dominio:

1. Ir a **Settings → Domains**
2. Agregar tu dominio personalizado
3. Verificar DNS records
4. Habilitar HTTPS

---

## 📊 Paso 8: Configurar Customer Portal

El Customer Portal permite a los usuarios gestionar su suscripción:

1. Ir a **Settings → Customer Portal**
2. Personalizar:
   - Logo
   - Colores de marca
   - Opciones permitidas (cancelar, pausar, actualizar payment method)

3. Copiar la URL del portal para usuarios (formato: `https://[tu-store].lemonsqueezy.com/billing`)

---

## ✅ Checklist de Configuración

Antes de ir a producción, verifica:

- [ ] API Key configurada y válida
- [ ] Store ID correcto
- [ ] Webhook configurado y recibiendo eventos
- [ ] Webhook Secret configurado en `.env`
- [ ] 3 Variant IDs configurados (Starter, Pro, Enterprise)
- [ ] Prueba de compra exitosa en Test Mode
- [ ] Webhook procesando correctamente los eventos
- [ ] Subscription actualizándose en la base de datos
- [ ] Test Mode desactivado antes de producción
- [ ] Customer Portal personalizado

---

## 🔧 Endpoints Creados

### 1. POST `/api/subscription/checkout`
Crea una sesión de checkout de Lemon Squeezy.

**Request:**
```json
{
  "plan": "starter" | "pro" | "enterprise"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://lemonsqueezy.com/checkout/..."
}
```

**Uso:**
```typescript
const response = await fetch("/api/subscription/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ plan: "pro" }),
});

const { checkoutUrl } = await response.json();
window.location.href = checkoutUrl; // Redirect to checkout
```

---

### 2. POST `/api/webhooks/lemonsqueezy`
Recibe eventos de Lemon Squeezy.

**Eventos manejados:**
- `subscription_created`: Suscripción creada → Actualiza plan en DB
- `subscription_updated`: Upgrade/downgrade → Actualiza límites
- `subscription_cancelled`: Cancelación → Marca como cancelled
- `subscription_expired`: Expiración → Marca como past_due
- `subscription_payment_failed`: Pago fallido → Marca como past_due
- `subscription_payment_success`: Pago exitoso → Marca como active

**Seguridad:**
- Verifica signature con HMAC SHA-256
- Usa `LEMONSQUEEZY_WEBHOOK_SECRET`

---

## 🌍 Pasar a Producción

1. **Desactivar Test Mode:**
   - Settings → General → Test Mode → OFF

2. **Configurar Webhook de Producción:**
   - URL debe ser HTTPS
   - Formato: `https://sealdrop.xyz/api/webhooks/lemonsqueezy`

3. **Actualizar Variables de Entorno:**
   - Cambiar a API Key de producción
   - Cambiar Variant IDs de producción
   - Cambiar Webhook Secret de producción

4. **Probar Flujo Completo:**
   - Crear checkout → Completar pago → Verificar webhook → Confirmar actualización en DB

---

## 🐛 Troubleshooting

### Webhook no se recibe

1. Verificar que la URL sea accesible públicamente
2. Revisar logs en Lemon Squeezy: **Webhooks → View Logs**
3. Verificar que HTTPS esté configurado (Lemon Squeezy solo envía a HTTPS)
4. Usar herramientas como [webhook.site](https://webhook.site) para debug

### Signature inválida

1. Verificar que `LEMONSQUEEZY_WEBHOOK_SECRET` sea correcto
2. Copiar exactamente el secret sin espacios
3. Reiniciar servidor después de cambiar `.env`

### Checkout no redirige

1. Verificar que `NEXT_PUBLIC_APP_URL` esté configurado
2. Asegurarse de que el redirect URL sea HTTPS en producción

---

## 📚 Recursos

- [Lemon Squeezy Docs](https://docs.lemonsqueezy.com/)
- [API Reference](https://docs.lemonsqueezy.com/api)
- [Webhook Events](https://docs.lemonsqueezy.com/api/webhooks)
- [Testing Guide](https://docs.lemonsqueezy.com/guides/testing)

---

## 🆘 Soporte

Si tienes problemas:
1. Revisar logs en `/api/webhooks/lemonsqueezy`
2. Contactar soporte de Lemon Squeezy
3. Revisar [Lemon Squeezy Status](https://status.lemonsqueezy.com/)

---

**Última actualización**: Noviembre 2024
