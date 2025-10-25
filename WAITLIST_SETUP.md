# Configuración de Waitlist con Google Sheets y Telegram

Esta guía te ayudará a configurar la captura de leads de tu landing page en Google Sheets y conectar tu grupo de Telegram.

## 1. Configurar Google Sheets

### Paso 1: Crear una Google Sheet

1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea una nueva hoja de cálculo
3. Nombra la hoja como "TransactEase Waitlist" o como prefieras
4. Agrega los siguientes encabezados en la primera fila:
   - Columna A: `Email`
   - Columna B: `Name`
   - Columna C: `Timestamp`
   - Columna D: `Source`

### Paso 2: Crear un Apps Script

1. En tu Google Sheet, ve a **Extensiones** → **Apps Script**
2. Reemplaza todo el código con el siguiente:

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
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Haz clic en **Guardar** (ícono de diskette)
4. Haz clic en **Implementar** → **Nueva implementación**
5. Selecciona el tipo: **Aplicación web**
6. Configura:
   - **Descripción**: Webhook para waitlist
   - **Ejecutar como**: Yo (tu email)
   - **Quién tiene acceso**: Cualquier persona
7. Haz clic en **Implementar**
8. **COPIA LA URL** que te proporciona. Se verá algo así:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

### Paso 3: Configurar Variable de Entorno

1. Abre tu archivo `.env.local` en la raíz del proyecto
2. Agrega la siguiente línea con la URL que copiaste:

```bash
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/TU_URL_AQUI/exec
```

3. Guarda el archivo

## 2. Configurar Grupo de Telegram

### Paso 1: Crear el Grupo

1. Abre Telegram
2. Crea un nuevo grupo o canal
3. Configura el nombre, descripción y foto
4. Crea un link de invitación:
   - En el grupo/canal, ve a **Ajustes** → **Editar**
   - Selecciona **Tipo de grupo/canal** → **Público** (o crea un link de invitación si es privado)
   - Copia el link (será algo como `https://t.me/tu_grupo`)

### Paso 2: Configurar Variable de Entorno

1. Abre tu archivo `.env.local`
2. Agrega la siguiente línea con tu link de Telegram:

```bash
NEXT_PUBLIC_TELEGRAM_GROUP_URL=https://t.me/tu_grupo
```

3. Guarda el archivo

## 3. Verificar la Configuración

Tu archivo `.env.local` debería tener estas nuevas variables:

```bash
# ... otras variables existentes ...

# Waitlist Configuration
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/TU_URL_AQUI/exec
NEXT_PUBLIC_TELEGRAM_GROUP_URL=https://t.me/tu_grupo
```

## 4. Reiniciar el Servidor de Desarrollo

1. Detén el servidor de desarrollo (Ctrl+C en la terminal)
2. Reinicia con `npm run dev`
3. Visita http://localhost:3000
4. Prueba el formulario de waitlist

## 5. Verificar que Funciona

### Probar Google Sheets:
1. Abre tu landing page en http://localhost:3000
2. Haz clic en "Join the Waitlist"
3. Ingresa un email y nombre de prueba
4. Envía el formulario
5. Verifica que aparezca una nueva fila en tu Google Sheet

### Probar Telegram:
1. Haz clic en el botón "Join Telegram Community"
2. Deberías ser redirigido a tu grupo/canal de Telegram

## Notas Importantes

- **Google Sheets**: La primera vez que uses el Apps Script, Google te pedirá que autorices la aplicación. Sigue los pasos de autorización.
- **Telegram**: Si tu grupo es privado, asegúrate de que el link de invitación sea válido y no expire.
- **Producción**: Cuando deploys a producción (Vercel, etc.), asegúrate de agregar estas variables de entorno en la configuración de tu plataforma de hosting.

## Troubleshooting

### Los datos no llegan a Google Sheets:
1. Verifica que la URL del webhook sea correcta
2. Revisa la consola del navegador para errores
3. Verifica los permisos del Apps Script
4. Asegúrate de que el proyecto tenga acceso a Internet

### El botón de Telegram no funciona:
1. Verifica que la variable `NEXT_PUBLIC_TELEGRAM_GROUP_URL` esté configurada
2. Asegúrate de que el link de Telegram sea válido
3. Reinicia el servidor después de agregar la variable

## Deployment a Producción

Cuando estés listo para publicar tu landing page:

1. **Vercel** (recomendado para Next.js):
   ```bash
   npm install -g vercel
   vercel
   ```

2. Agrega las variables de entorno en la configuración de Vercel:
   - Ve a tu proyecto en Vercel Dashboard
   - Settings → Environment Variables
   - Agrega `GOOGLE_SHEETS_WEBHOOK_URL` y `NEXT_PUBLIC_TELEGRAM_GROUP_URL`

3. Redeploy el proyecto

Tu landing page estará lista para capturar leads mientras sigues desarrollando el resto de la aplicación.
