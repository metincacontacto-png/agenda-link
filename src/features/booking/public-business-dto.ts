/** Public-only contract returned by GET /api/availability. */
export interface PublicBusinessDTO {
  id: string;
  name: string;
  slug: string;
  category: string;
  currency: string;
  timezone: string;
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
  professionals: Array<{
    id: string;
    name: string;
    avatar: string | null;
  }>;
}
