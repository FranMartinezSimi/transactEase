# TransactEase MVP

Comparte documentos sensibles con auto-destrucción, cifrado automático y **auditoría forense completa**. Perfecto para compliance GDPR, HIPAA y más.

## 🚀 Stack Tecnológico

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + TailwindCSS 4
- **Backend:** Next.js Server Actions
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Email:** Resend
- **Deploy:** Vercel
- **Language:** TypeScript

## 🎯 Features (MVP)

### ✅ Fase 1: Landing Page (Completado)
- Landing page profesional con black theme
- Responsive design
- SEO optimizado
- Coming soon page para rutas en desarrollo

### 🚧 En Desarrollo
- Fase 2: Autenticación (email/password con Supabase)
- Fase 3: Envío de documentos (hasta 300MB)
- Fase 4: Vista de documento temporal
- Fase 5: **Auditoría forense completa** (diferenciador)
- Fase 6: Dashboard con métricas
- Fase 7: Gestión de usuarios (admin)
- Fase 8: Settings de organización

Ver [PLAN_MIGRACION_INCREMENTAL.md](../PLAN_MIGRACION_INCREMENTAL.md) para detalles completos.

## 📦 Setup Local

### Prerrequisitos
- Node.js 18+
- npm/yarn/pnpm
- Cuenta en Supabase (para fase 2+)

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repo>
   cd transactease-mvp
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```

   Edita `.env.local` y completa:
   - `NEXT_PUBLIC_APP_URL` → `http://localhost:3000`
   - Las demás variables se necesitan en fases posteriores

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy a Producción (Vercel)

### Primera vez

1. **Push a GitHub/GitLab**
   ```bash
   git add .
   git commit -m "feat: initial setup with landing page"
   git push origin main
   ```

2. **Conectar con Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Selecciona tu repositorio
   - Framework Preset: **Next.js** (auto-detectado)
   - Click "Deploy"

3. **Configurar variables de entorno**
   - En Vercel Dashboard → Settings → Environment Variables
   - Agrega las variables de `.env.example`
   - Por ahora solo necesitas `NEXT_PUBLIC_APP_URL` (tu dominio de Vercel)

4. **Configurar dominio custom (opcional)**
   - Vercel Dashboard → Settings → Domains
   - Agregar dominio
   - Configurar DNS según instrucciones de Vercel
   - SSL automático

### Workflow de Desarrollo

```bash
# Trabajar en feature nueva
git checkout -b feature/nombre-feature

# Hacer cambios y commit
git add .
git commit -m "feat: descripción"
git push origin feature/nombre-feature

# Vercel crea automáticamente preview URL
# Ejemplo: transactease-git-feature-nombre.vercel.app

# Testing en preview

# Merge a main (deploy automático a producción)
git checkout main
git merge feature/nombre-feature
git push origin main
```

## 🔒 Protección de Rutas

El middleware (`src/middleware.ts`) protege rutas en desarrollo:

- ✅ **Públicas:** `/` (landing), `/coming-soon`
- 🚧 **Protegidas:** Todo lo demás redirige a `/coming-soon`

Para habilitar una ruta en producción:
1. Completa su implementación
2. Actualiza `middleware.ts` agregándola a `publicPaths`
3. Deploy

## 📁 Estructura del Proyecto

```
transactease-mvp/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout principal
│   │   ├── page.tsx            # Landing page
│   │   ├── coming-soon/        # Página "Próximamente"
│   │   ├── globals.css         # Estilos globales + theme
│   │   └── (rutas futuras)
│   ├── components/             # Componentes reutilizables
│   ├── lib/                    # Utilidades y helpers
│   │   └── supabase/           # Clientes de Supabase
│   ├── middleware.ts           # Protección de rutas
│   └── types/                  # TypeScript types
├── public/                     # Assets estáticos
├── .env.example                # Template de variables
└── README.md                   # Este archivo
```

## 🎨 Theme

El proyecto usa un **black theme profesional**:

- **Primary:** Electric Emerald (seguridad, verificación)
- **Accent:** Amber Fire (auto-destrucción, alertas)
- **Background:** True Black (#171717)

Personalizar en `src/app/globals.css`

## 📚 Documentación Adicional

- [Plan de Migración](../PLAN_MIGRACION_INCREMENTAL.md) - Estrategia completa
- [Definición MVP](../MVP_DEFINITION_V2.md) - Qué incluir/excluir
- [Análisis de Endpoints](../ENDPOINT_ANALYSIS.md) - Backend actual

## 🐛 Troubleshooting

### El dev server no inicia
```bash
# Limpiar cache
rm -rf .next node_modules
npm install
npm run dev
```

### Errores de Tailwind/CSS
```bash
# Verificar que globals.css esté importado en layout.tsx
# Reiniciar dev server
```

### Preview deployment falla
- Verifica que todas las variables de entorno estén configuradas en Vercel
- Revisa los logs en Vercel Dashboard

## 🤝 Contribuir

1. Fork el repo
2. Crea tu feature branch (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'feat: add amazing feature'`)
4. Push a la branch (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📝 Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Bug fix
- `docs:` Documentación
- `style:` Formato, estilos
- `refactor:` Refactorización de código
- `test:` Tests
- `chore:` Mantenimiento

## 📄 Licencia

Propiedad privada. Todos los derechos reservados.

## 📧 Contacto

- Email: contacto@transactease.com
- Website: [transactease.com](https://transactease.com)

---

**Hecho con ❤️ para compliance y seguridad**
