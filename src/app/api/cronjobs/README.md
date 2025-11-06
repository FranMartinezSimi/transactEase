# Cronjob Cleanup Endpoint

Este endpoint se encarga de limpiar las deliveries expiradas o revocadas, eliminando sus archivos de S3 y sus registros de la base de datos.

## Endpoint

```
GET /api/cronjobs
```

## Funcionamiento

1. Busca todas las deliveries con status `expired` o `revoked`
2. Para cada delivery:
   - Elimina todos los archivos asociados de S3
   - Elimina el registro de la delivery de la base de datos (cascade elimina delivery_files)
3. Retorna un resumen de la operación

## Respuesta

```json
{
  "message": "Cleanup job completed",
  "totalProcessed": 5,
  "successCount": 5,
  "errorCount": 0
}
```

## Configuración de Cronjob

### Opción 1: Vercel Cron Jobs

Agrega a tu `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cronjobs",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Opción 2: GitHub Actions

Crea `.github/workflows/cleanup-cron.yml`:

```yaml
name: Cleanup Expired Deliveries

on:
  schedule:
    - cron: '0 0 * * *' # Runs at 00:00 UTC daily

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call cleanup endpoint
        run: |
          curl -X GET https://your-domain.com/api/cronjobs
```

### Opción 3: cron-job.org

1. Visita https://cron-job.org
2. Crea una nueva tarea
3. URL: `https://your-domain.com/api/cronjobs`
4. Schedule: `0 0 * * *` (diario a medianoche)

### Opción 4: Manual

Puedes llamar al endpoint manualmente cuando lo necesites:

```bash
curl -X GET https://your-domain.com/api/cronjobs
```

## Seguridad

**IMPORTANTE**: Este endpoint debería estar protegido con autenticación o un token secreto en producción.

Ejemplo de protección:

```typescript
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // ... resto del código
}
```

## Logging

Todos los eventos son registrados usando el logger:
- Inicio del job
- Deliveries encontradas
- Archivos eliminados de S3
- Deliveries eliminadas de DB
- Errores en cualquier paso
- Resumen final
