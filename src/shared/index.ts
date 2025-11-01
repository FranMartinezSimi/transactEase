/**
 * Shared - Public API
 *
 * Código compartido entre todos los features:
 * - Components UI globales
 * - Hooks reutilizables
 * - Librerías (Supabase, Email, Logger)
 * - Utilidades y validaciones
 */

// Components
export { AuthenticatedLayout } from "./components/AuthenticatedLayout";
export { ReactQueryProvider } from "./components/ReactQueryProvider";
export * from "./components/ui";

// Hooks
export { useMobile } from "./hooks/use-mobile";
export { useTheme } from "./hooks/useTheme";

// Lib
export { createClient } from "./lib/supabase/client";
export { createClient as createServerClient } from "./lib/supabase/server";
export { sendDeliveryNotification } from "./lib/email/send-delivery-notification";
export { sendAccessCode } from "./lib/email/send-access-code";
export { logger } from "./lib/logger";
export { analytics } from "./lib/analytics";

// Utils
export { cn } from "./utils/utils";
export * from "./utils/validations/common";
export * from "./utils/validations/file";
