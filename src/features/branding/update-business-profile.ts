import { prisma } from "@/lib/db";
import { uploadBase64ToR2, deleteFromR2 } from "@/features/media/storage";
import type { UpdateBusinessProfileInput } from "@/features/branding/validation";

const IMAGE_FIELDS = ["logoUrl", "landingCoverUrl", "landingSecondaryCoverUrl"] as const;
type ImageField = (typeof IMAGE_FIELDS)[number];

export async function updateBusinessProfile(
  businessId: string,
  slug: string,
  input: UpdateBusinessProfileInput,
) {
  const existing = await prisma.business.findUnique({
    where: { id: businessId },
    select: { logoUrl: true, landingCoverUrl: true, landingSecondaryCoverUrl: true },
  });
  if (!existing) return null;

  const nextImageValues: Partial<Record<ImageField, string | null | undefined>> = {};
  for (const field of IMAGE_FIELDS) {
    const value = input[field];
    if (value === undefined) continue;
    if (value === null || value === "") {
      nextImageValues[field] = null;
    } else {
      const prefix = field === "logoUrl" ? `logo_${slug}` : field === "landingCoverUrl" ? `cover_${slug}` : `seccover_${slug}`;
      nextImageValues[field] = await uploadBase64ToR2(value, prefix) ?? null;
    }
  }

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      name: input.name,
      category: input.category,
      teamSize: input.teamSize,
      currency: input.currency,
      logoUrl: nextImageValues.logoUrl,
      landingTitle: input.landingTitle,
      landingSubtitle: input.landingSubtitle,
      landingAbout: input.landingAbout,
      landingCoverUrl: nextImageValues.landingCoverUrl,
      landingSecondaryCoverUrl: nextImageValues.landingSecondaryCoverUrl,
      landingPhone: input.landingPhone,
      landingAddress: input.landingAddress,
      landingHours: input.landingHours,
      landingFeaturesJson: input.landingFeaturesJson,
      landingTestimonialsJson: input.landingTestimonialsJson,
      plan: input.plan,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerName: true,
      category: true,
      country: true,
      teamSize: true,
      currency: true,
      timezone: true,
      plan: true,
      billingBypass: true,
      customDomain: true,
      logoUrl: true,
      landingTitle: true,
      landingSubtitle: true,
      landingAbout: true,
      landingCoverUrl: true,
      landingSecondaryCoverUrl: true,
      landingPhone: true,
      landingAddress: true,
      landingHours: true,
      landingFeaturesJson: true,
      landingTestimonialsJson: true,
    },
  });

  for (const field of IMAGE_FIELDS) {
    const previous = existing[field];
    const next = nextImageValues[field];
    if (input[field] !== undefined && previous && previous !== next) {
      await deleteFromR2(previous);
    }
  }

  return updated;
}
