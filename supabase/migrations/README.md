# Database Migrations

## Cómo aplicar migraciones en Supabase

### Opción 1: SQL Editor (Recomendado para MVP)

1. Ve a tu proyecto en Supabase Dashboard
2. Click en **SQL Editor** en el menú lateral
3. Click en **+ New query**
4. Copia y pega el contenido completo de `001_oauth_setup.sql`
5. Click **Run** (o presiona Cmd/Ctrl + Enter)
6. Verifica que todas las queries se ejecutaron sin errores

### Opción 2: Supabase CLI (Para producción)

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Login
supabase login

# Link a tu proyecto
supabase link --project-ref your-project-id

# Aplicar migraciones
supabase db push
```

## Migración 001: OAuth Setup

**Archivo:** `001_oauth_setup.sql`

**Qué hace:**
- ✅ Crea tabla `invitations` para invitar usuarios a organizaciones
- ✅ Actualiza rol enum en `profiles` para incluir 'owner'
- ✅ Crea trigger para auto-crear profile cuando usuario hace OAuth signup
- ✅ Configura RLS policies para invitations
- ✅ Actualiza RLS policies de profiles (soporta temp users + OAuth users)
- ✅ Crea función helper `accept_invitation()` para aceptar invitaciones

**Seguro de aplicar:** ✅ Sí
- No elimina datos
- No modifica datos existentes
- Solo agrega tablas, funciones y policies nuevas
- Compatible con temporary users existentes

## Verificación Post-Migración

Después de aplicar, verifica en Supabase:

### 1. Tabla invitations creada
```sql
SELECT * FROM public.invitations LIMIT 1;
```

### 2. Trigger funciona
```sql
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';
```

### 3. RLS habilitado
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('invitations', 'profiles');
```

## Rollback (Si algo sale mal)

Si necesitas revertir:

```sql
-- Eliminar tabla invitations
DROP TABLE IF EXISTS public.invitations CASCADE;

-- Eliminar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.accept_invitation(text);

-- Revertir role constraint (si es necesario)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'member'));
```

## Próximas Migraciones

Futuras migraciones se numerarán secuencialmente:
- `002_*.sql`
- `003_*.sql`
- etc.
