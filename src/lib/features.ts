export const FEATURES = {
  pagosOnline: true,         // pagos online con Mercado Pago (Redcompra y tarjetas) o en el local
  whatsappAutomatico: true,  // recordatorios por WhatsApp en 1 clic y notificaciones
  linkiIA: false,            // Próximamente (en desarrollo según Ley 19.496 art. 28)
  facturacion: false,        // ventas facturadas / boletas
  giftCards: false,          // gift cards y fidelización
} as const;

export type FeatureKey = keyof typeof FEATURES;
