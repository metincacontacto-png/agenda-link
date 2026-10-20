export const FEATURES = {
  pagosOnline: true,         // tarjeta / Apple Pay / Mercado Pago al reservar
  whatsappAutomatico: false, // recordatorios y mensajes automáticos a clientes
  linkiIA: false,            // Linki Secretary, Marketing y Business
  facturacion: false,        // ventas facturadas / boletas
  giftCards: false,          // gift cards y fidelización
} as const;

export type FeatureKey = keyof typeof FEATURES;
