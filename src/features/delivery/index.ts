/**
 * Delivery Feature - Public API
 *
 * Este feature maneja toda la funcionalidad de entregas (deliveries):
 * - Creación y gestión de deliveries
 * - Visualización y descarga de archivos
 * - Control de acceso y códigos de verificación
 */

// Types
export type {
  DeliveryFile,
  DeliveryWithFiles,
  DeliveryFilters,
  CreateDeliveryData,
  DeliveryStats,
  IDeliveryRepository,
} from "./types/delivery.interface";

// Services
export { DeliveryRepository } from "./services/delivery.repository";
export { DeliveryService } from "./services/delivery.service";

// Hooks
export { useDeliveries } from "./hooks/useDeliveries";

// Components
export { DeliveryActions } from "./components/DeliveryActions";

// Actions (Server Actions)
export {
  revokeDelivery,
  deleteDelivery,
  resendDeliveryNotification,
  getDeliveryLink,
} from "./actions/delivery-actions";
