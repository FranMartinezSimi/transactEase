import pino from "pino";

// Detección robusta de entorno
const isDevelopment = process.env.NODE_ENV === "development";
const isVercel = !!(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.cwd().includes("/ROOT") ||
  process.env.PWD?.includes("vercel")
);

// NUNCA usar pino-pretty - siempre usar formato JSON estándar de pino
// Esto evita problemas con thread-stream en Vercel/producción
// Para desarrollo local, usamos el script pretty-logs.mjs que formatea la salida

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  // NO usar transport - pino usa JSON por defecto (más seguro y compatible)
  base: {
    env: process.env.NODE_ENV || "production",
    vercel: isVercel,
  },
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
    log: (object) => {
      // Mejorar formato de errores
      if (object.err) {
        const err = object.err as Error;
        return {
          ...object,
          err: {
            type: err.name,
            message: err.message,
            stack: err.stack,
          },
        };
      }
      return object;
    },
  },
  serializers: {
    error: pino.stdSerializers.err,
  },
  timestamp: () => new Date().toISOString().substring(0, 23),
});

export function createContextLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
