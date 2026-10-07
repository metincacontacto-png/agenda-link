import type { ProfessionalDTO } from "@/features/team/contracts";

export interface BusinessAppointmentDTO {
  id: string;
  status: string;
  clientName: string;
  clientWhatsApp: string;
  dateTime: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentAmount: number | null;
  service: { name: string; duration: number; price: number };
  professional: { name: string };
}

export interface BusinessAdminDTO {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  category: string;
  country: string;
  teamSize: string;
  currency: string;
  timezone: string;
  plan: string;
  billingBypass: boolean;
  customDomain: string | null;
  logoUrl: string | null;
  landingTitle: string | null;
  landingSubtitle: string | null;
  landingAbout: string | null;
  landingCoverUrl: string | null;
  landingSecondaryCoverUrl: string | null;
  landingPhone: string | null;
  landingAddress: string | null;
  landingHours: string | null;
  landingFeaturesJson: string | null;
  landingTestimonialsJson: string | null;
  services: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
    imageUrl: string | null;
  }>;
  professionals: ProfessionalDTO[];
  appointments: BusinessAppointmentDTO[];
}

export interface AdminAppointmentsPaginationDTO {
  total: number;
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
  piiRedacted: boolean;
}
