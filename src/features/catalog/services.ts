import { prisma } from "@/lib/db";
import { uploadBase64ToR2, deleteFromR2 } from "@/features/media/storage";
import type { CreateServiceInput } from "@/features/catalog/validation";

export async function createCatalogService(
  businessId: string,
  businessSlug: string,
  input: CreateServiceInput,
) {
  const imageUrl = await uploadBase64ToR2(input.imageUrl, `service_${businessSlug}`);
  return prisma.service.create({
    data: {
      businessId,
      name: input.name,
      price: input.price,
      duration: input.duration,
      imageUrl: imageUrl || null,
    },
    select: { id: true, name: true, price: true, duration: true, imageUrl: true },
  });
}

export async function deleteCatalogService(serviceId: string): Promise<boolean> {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, imageUrl: true },
  });
  if (!service) return false;

  if (service.imageUrl) await deleteFromR2(service.imageUrl);
  await prisma.service.delete({ where: { id: service.id } });
  return true;
}
