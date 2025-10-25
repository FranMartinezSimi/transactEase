# Guía de Configuración: Supabase + Google OAuth

Esta guía te llevará paso a paso para configurar Supabase y habilitar Google OAuth en TransactEase.

**Tiempo estimado:** 20-30 minutos

---

## 📋 Prerrequisitos

- [ ] Cuenta en [Supabase](https://supabase.com) (gratis)
- [ ] Cuenta en [Google Cloud Console](https://console.cloud.google.com) (gratis)
- [ ] Proyecto Next.js corriendo en local

---

## Parte 1: Crear Proyecto en Supabase (10 min)

### 1.1. Crear cuenta y proyecto

1. Ve a https://supabase.com y crea una cuenta (o inicia sesión)

2. Click en "New project"

3. Llena los datos:
   - **Name**: `TransactEase` (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña fuerte (guárdala en un lugar seguro)
   - **Region**: Elige el más cercano a tus usuarios (ej: `US East (North Virginia)`)
   - **Pricing Plan**: `Free` (para desarrollo)

4. Click "Create new project" y espera 1-2 minutos

### 1.2. Obtener credenciales de Supabase

1. Una vez creado el proyecto, ve a **Settings** (ícono de engranaje) → **API**

2. Copia estas 2 credenciales:
   - **Project URL** (ej: `https://abcdefghijk.supabase.co`)
   - **anon public** key (el API Key que dice "anon" / "public")

3. Crea un archivo `.env.local` en la raíz de tu proyecto:

```bash
# En la raíz del proyecto
cp .env.example .env.local
```

4. Abre `.env.local` y reemplaza:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **Checkpoint:** Tu app ahora puede conectarse a Supabase (aunque OAuth aún no funciona)

---

## Parte 2: Configurar Google Cloud Console (15 min)

### 2.1. Crear proyecto en Google Cloud

1. Ve a https://console.cloud.google.com

2. Click en el dropdown de proyectos (arriba a la izquierda, al lado de "Google Cloud")

3. Click "NEW PROJECT"

4. Llena:
   - **Project name**: `TransactEase`
   - **Organization**: Deja en blanco (o tu org si tienes)

5. Click "CREATE"

6. Espera unos segundos y selecciona el proyecto recién creado

### 2.2. Habilitar Google+ API

1. En el buscador de arriba, escribe: `Google+ API`

2. Click en "Google+ API" en los resultados

3. Click "ENABLE"

### 2.3. Configurar OAuth Consent Screen

1. En el menú lateral, ve a: **APIs & Services** → **OAuth consent screen**

2. Selecciona **External** (a menos que tengas Google Workspace)

3. Click "CREATE"

4. Llena el formulario:

   **App information:**
   - **App name**: `TransactEase`
   - **User support email**: tu email
   - **App logo**: (opcional) puedes dejarlo en blanco por ahora

   **Developer contact information:**
   - **Email addresses**: tu email

5. Click "SAVE AND CONTINUE"

6. En **Scopes**, click "SAVE AND CONTINUE" (no agregues scopes adicionales por ahora)

7. En **Test users**:
   - Click "+ ADD USERS"
   - Agrega tu email (el que usarás para probar)
   - Click "ADD"
   - Click "SAVE AND CONTINUE"

8. Revisa el resumen y click "BACK TO DASHBOARD"

### 2.4. Crear credenciales OAuth

1. Ve a: **APIs & Services** → **Credentials**

2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"

3. Si te pide configurar el consent screen, click "CONFIGURE CONSENT SCREEN" y completa los pasos anteriores

4. Selecciona:
   - **Application type**: `Web application`
   - **Name**: `TransactEase Web Client`

5. En **Authorized JavaScript origins**, click "+ ADD URI":
   - `http://localhost:3000` (para desarrollo local)

6. En **Authorized redirect URIs**, click "+ ADD URI":
   - Copia tu Project URL de Supabase: `https://abcdefghijk.supabase.co`
   - Agrega al final: `/auth/v1/callback`
   - **URI completa**: `https://abcdefghijk.supabase.co/auth/v1/callback`

   Ejemplo:
   ```
   https://abcdefghijk.supabase.co/auth/v1/callback
   ```

7. Click "CREATE"

8. **IMPORTANTE:** Se abrirá un modal con:
   - **Client ID**: algo como `123456789-abcd.apps.googleusercontent.com`
   - **Client secret**: algo como `GOCSPX-xxxxxxxxxxxxx`

   ⚠️ **Guarda estos datos** (los necesitarás en el siguiente paso)

---

## Parte 3: Conectar Google con Supabase (5 min)

### 3.1. Habilitar Google Provider en Supabase

1. Vuelve a tu proyecto en Supabase

2. Ve a: **Authentication** (ícono de llave) → **Providers**

3. Busca **Google** en la lista de providers

4. Click en **Google** para expandir

5. Activa el toggle "Enable Sign in with Google"

6. Pega las credenciales de Google Cloud:
   - **Client ID**: `123456789-abcd.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxxxxxxxxx`

7. Click "Save"

✅ **Checkpoint:** Google OAuth ya está configurado en el backend

---

## Parte 4: Configurar Tabla de Usuarios (Opcional)

Si quieres guardar información adicional de usuarios:

### 4.1. Crear tabla profiles

1. En Supabase, ve a **Table Editor** → **+ New table**

2. Configura:
   - **Name**: `profiles`
   - **Description**: User profile information
   - **Enable RLS**: ✅ (activado)

3. Agrega columnas:

   ```
   id          | uuid       | Relationships: auth.users.id | Primary Key
   email       | text       |
   full_name   | text       |
   avatar_url  | text       |
   company     | text       | (opcional)
   created_at  | timestamptz | Default: now()
   updated_at  | timestamptz | Default: now()
   ```

4. Click "Save"

### 4.2. Configurar RLS (Row Level Security)

1. En la tabla `profiles`, click en "..." → "Edit RLS policies"

2. Click "+ New Policy"

3. **Policy 1: Enable read access for authenticated users**
   ```sql
   Policy name: Users can view own profile
   Policy command: SELECT
   Target roles: authenticated

   USING expression:
   (auth.uid() = id)
   ```

4. Click "+ New Policy"

5. **Policy 2: Enable insert for new users**
   ```sql
   Policy name: Users can insert own profile
   Policy command: INSERT
   Target roles: authenticated

   WITH CHECK expression:
   (auth.uid() = id)
   ```

6. Click "+ New Policy"

7. **Policy 3: Enable update for own profile**
   ```sql
   Policy name: Users can update own profile
   Policy command: UPDATE
   Target roles: authenticated

   USING expression:
   (auth.uid() = id)

   WITH CHECK expression:
   (auth.uid() = id)
   ```

8. Click "Review" → "Save policy"

---

## Parte 5: Configurar Redirect URL en Desarrollo (5 min)

### 5.1. Agregar localhost como URL válida

1. En Supabase, ve a: **Authentication** → **URL Configuration**

2. En **Redirect URLs**, agrega:
   ```
   http://localhost:3000/auth/callback
   ```

3. Click "+ Add URL"

4. Verifica que también esté:
   ```
   http://localhost:3000/**
   ```
   (El `/**` permite cualquier ruta en localhost)

5. Click "Save"

---

## Parte 6: Testing (5 min)

### 6.1. Probar conexión

1. En tu proyecto Next.js, reinicia el servidor:
   ```bash
   npm run dev
   ```

2. Ve a: http://localhost:3000/auth/login

3. Click en "Continue with Google"

4. Deberías ver:
   - ✅ Redirect a Google login
   - ✅ Solicitud de permisos (email, profile)
   - ✅ Redirect de vuelta a tu app

5. Si todo funciona, verás tu usuario en:
   - **Supabase Dashboard** → **Authentication** → **Users**

### 6.2. Problemas comunes

**Error: "redirect_uri_mismatch"**
- Verifica que el redirect URI en Google Cloud sea exacto
- Debe ser: `https://tu-project-id.supabase.co/auth/v1/callback`
- No debe tener slash final

**Error: "Invalid email domain"**
- Si estás en modo de prueba, verifica que tu email esté en la lista de test users
- Publica la app (OAuth consent screen → "PUBLISH APP")

**Usuario no se crea en Supabase**
- Verifica que el email del usuario esté confirmado
- Revisa los logs en: **Logs** → **Auth logs**

---

## Parte 7: Configuración para Producción

Cuando estés listo para producción:

### 7.1. Actualizar redirect URIs en Google

1. Ve a Google Cloud Console → Credentials

2. Click en tu OAuth Client

3. En **Authorized redirect URIs**, agrega:
   ```
   https://tu-dominio-produccion.com/auth/callback
   ```

4. En **Authorized JavaScript origins**, agrega:
   ```
   https://tu-dominio-produccion.com
   ```

5. Click "SAVE"

### 7.2. Actualizar Supabase

1. En Supabase → Authentication → URL Configuration

2. Agrega en **Redirect URLs**:
   ```
   https://tu-dominio-produccion.com/auth/callback
   ```

3. En **Site URL**, cambia a:
   ```
   https://tu-dominio-produccion.com
   ```

4. Click "Save"

### 7.3. Variables de entorno en Vercel

1. En Vercel → Tu proyecto → Settings → Environment Variables

2. Agrega:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

3. Aplica a: Production, Preview, Development

4. Redeploy

---

## ✅ Checklist Final

Antes de continuar con el código:

- [ ] Proyecto en Supabase creado
- [ ] Variables en `.env.local` configuradas
- [ ] Proyecto en Google Cloud creado
- [ ] OAuth Consent Screen configurado
- [ ] OAuth Client creado
- [ ] Client ID y Secret copiados a Supabase
- [ ] Google Provider habilitado en Supabase
- [ ] Redirect URLs configuradas en ambos lados
- [ ] Tabla `profiles` creada (opcional)
- [ ] RLS policies configuradas (opcional)
- [ ] Testing realizado con éxito

---

## 📚 Referencias

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

---

## 🆘 Ayuda

Si tienes problemas:

1. Revisa los logs en Supabase: **Logs** → **Auth logs**
2. Revisa la consola del navegador (F12)
3. Verifica que todas las URLs sean exactas (sin espacios, con https, etc.)
4. Si usas localhost, usa `http://` (sin s)
5. Si usas producción, usa `https://` (con s)

---

**¡Configuración completa!** 🎉

Ahora puedes continuar con el código de integración.
