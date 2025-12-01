/**
 * Lemon Squeezy Configuration
 *
 * Para configurar:
 * 1. Ir a https://app.lemonsqueezy.com/settings/api
 * 2. Crear API Key y agregar a LEMONSQUEEZY_API_KEY
 * 3. Obtener Store ID del dashboard
 * 4. Crear productos y variants en Lemon Squeezy
 * 5. Agregar los variant IDs a las variables de entorno
 */

import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

// Initialize Lemon Squeezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY || "",
  onError: (error) => {
    console.error("[Lemon Squeezy] Error:", error);
    throw error;
  },
});

export const LEMONSQUEEZY_CONFIG = {
  storeId: process.env.LEMONSQUEEZY_STORE_ID || "",
  webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "",

  // Plan variant IDs (estos los obtienes de tu dashboard de Lemon Squeezy)
  plans: {
    starter: {
      variantId: process.env.LEMONSQUEEZY_STARTER_VARIANT_ID || "",
      name: "Starter",
      price: "$19/month",
      deliveries: 50,
      storage: 10,
      users: 5,
    },
    pro: {
      variantId: process.env.LEMONSQUEEZY_PRO_VARIANT_ID || "",
      name: "Pro",
      price: "$49/month",
      deliveries: 500,
      storage: 50,
      users: 20,
    },
    enterprise: {
      variantId: process.env.LEMONSQUEEZY_ENTERPRISE_VARIANT_ID || "",
      name: "Enterprise",
      price: "Custom",
      deliveries: -1, // unlimited
      storage: 500,
      users: -1, // unlimited
    },
  },
};

// Validate config
export function validateLemonSqueezyConfig() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;

  if (!apiKey || apiKey === "your_api_key_here") {
    throw new Error("LEMONSQUEEZY_API_KEY not configured");
  }

  if (!storeId || storeId === "your_store_id_here") {
    throw new Error("LEMONSQUEEZY_STORE_ID not configured");
  }

  return true;
}
