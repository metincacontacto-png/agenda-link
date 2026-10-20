export const FEATURES = {
  pagosOnline: true,         // pagos online con Mercado Pago (Redcompra y tarjetas) o en el local
  whatsappAutomatico: true,  // recordatorios por WhatsApp en 1 clic y notificaciones
  linkiIA: true,             // Linki Secretary, Marketing y Business activos con Gemini 2.5 Flash
  facturacion: false,        // ventas facturadas / boletas
  giftCards: false,          // gift cards y fidelización
} as const;

export type FeatureKey = keyof typeof FEATURES;
