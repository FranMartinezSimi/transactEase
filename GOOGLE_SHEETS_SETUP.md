# Configuración de Google Sheets para Waitlist

Esta guía te ayudará a conectar el formulario de waitlist con Google Sheets para capturar leads automáticamente.

## Paso 1: Crear Google Sheet

1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea una nueva hoja de cálculo
3. Nómbrala "TransactEase Waitlist"
4. En la primera fila, agrega estos encabezados:
   - **A1**: `Email`
   - **B1**: `Name`
   - **C1**: `Timestamp`
   - **D1**: `Source`

## Paso 2: Crear Apps Script Webhook

1. En tu Google Sheet, ve a **Extensiones** → **Apps Script**
2. Borra todo el código por defecto
3. Pega el siguiente código:

```javascript
function doPost(e) {
  try {
    // Obtener la hoja activa
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Parsear los datos recibidos
    var data = JSON.parse(e.postData.contents);

    // Agregar una nueva fila con los datos
    sheet.appendRow([
      data.email,
      data.name,
      data.timestamp,
      data.source
    ]);

    // Respuesta exitosa
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Respuesta de error
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Haz clic en el icono de **💾 Guardar**
5. Dale un nombre al proyecto (ej: "Waitlist Webhook")

## Paso 3: Implementar el Script

1. Haz clic en **Implementar** → **Nueva implementación**
2. Selecciona el tipo: **Aplicación web**
3. Configura lo siguiente:
   - **Descripción**: Webhook para waitlist
   - **Ejecutar como**: Yo (tu email)
   - **Quién tiene acceso**: **Cualquier persona**
4. Haz clic en **Implementar**
5. **IMPORTANTE**: Copia la URL que te da. Se verá así:
   ```
   https://script.google.com/macros/s/AKfycbx...ABC123.../exec
   ```

## Paso 4: Autorizar el Script

La primera vez que lo implementes, Google te pedirá autorización:

1. Haz clic en **Autorizar acceso**
2. Selecciona tu cuenta de Google
3. Ve a **Configuración avanzada**
4. Haz clic en **Ir a [Nombre del Proyecto] (no seguro)**
5. Haz clic en **Permitir**

## Paso 5: Configurar Variable de Entorno en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega una nueva variable:
   - **Key**: `GOOGLE_SHEETS_WEBHOOK_URL`
   - **Value**: La URL que copiaste en el Paso 3
   - **Environments**: Selecciona **Production**, **Preview** y **Development**
5. Haz clic en **Save**

## Paso 6: Redeploy en Vercel

Para que tome los cambios:

1. Ve a **Deployments** en tu proyecto de Vercel
2. Encuentra el último deployment exitoso
3. Haz clic en los 3 puntos **⋯** → **Redeploy**
4. Selecciona **Use existing Build Cache** (opcional)
5. Haz clic en **Redeploy**

## Verificar que Funciona

1. Ve a tu landing page: https://transact-ease-self.vercel.app/
2. Haz clic en "Join the Waitlist"
3. Ingresa un email y nombre de prueba
4. Envía el formulario
5. Verifica que aparezca una nueva fila en tu Google Sheet

## Troubleshooting

### No aparecen datos en la Sheet

1. **Verifica la URL del webhook**: Asegúrate de que la URL en Vercel sea correcta
2. **Verifica los permisos**: El script debe tener acceso "Cualquier persona"
3. **Revisa los logs**:
   - En Apps Script: **Ejecutar** → Ver **Registro de ejecución**
   - En Vercel: **Deployments** → **Functions** → Busca errores

### Error "Authorization required"

1. Ve a Apps Script
2. Ejecuta manualmente la función `doPost` una vez
3. Acepta todos los permisos
4. Vuelve a implementar el script

### Los datos llegan duplicados

- Esto puede pasar si el usuario hace clic múltiples veces
- Puedes agregar validación en el Apps Script para evitar duplicados

## Configuración Local (Opcional)

Si quieres probar en local:

1. Agrega la variable a tu `.env.local`:
   ```bash
   GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/TU_URL_AQUI/exec
   ```
2. Reinicia el servidor: `npm run dev`
3. Prueba en http://localhost:3000

## Próximos Pasos

Una vez que tengas Google Sheets funcionando, puedes:
- Configurar notificaciones por email cuando llegue un nuevo lead
- Crear un dashboard en Google Data Studio
- Exportar los datos a tu CRM
- Agregar más campos al formulario

---

¿Necesitas ayuda? Revisa la [documentación de Google Apps Script](https://developers.google.com/apps-script).
