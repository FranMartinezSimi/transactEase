/**
 * Auth Feature - Public API
 *
 * Este feature maneja toda la funcionalidad de autenticación:
 * - Login/Register/Logout
 * - Gestión de perfiles de usuario
 * - Validaciones de auth
 */

// Hooks
export { useProfile } from "./hooks/useProfile";

// Services
export { signOut } from "./services/auth";

// Types & Validations
export type { LoginFormData, RegisterFormData } from "./utils/auth";
export { loginSchema, registerSchema } from "./utils/auth";
