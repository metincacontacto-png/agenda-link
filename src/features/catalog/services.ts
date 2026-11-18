import { prisma } from "@/lib/db";
import { uploadBase64ToR2, deleteFromR2 } from "@/features/media/storage";
import type { CreateServiceInput, UpdateServiceInput } from "@/features/catalog/validation";

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

export async function updateCatalogService(
  businessId: string,
  businessSlug: string,
  input: UpdateServiceInput,
) {
  const existing = await prisma.service.findFirst({
    where: { id: input.id, businessId },
    select: { id: true, imageUrl: true },
  });
  if (!existing) return null;

  let finalImageUrl: string | null = existing.imageUrl;

  if (input.imageUrl !== undefined) {
    if (!input.imageUrl || input.imageUrl.trim() === "") {
      if (existing.imageUrl) {
        try {
          await deleteFromR2(existing.imageUrl);
        } catch (err) {
          console.warn("Failed to delete previous service image from R2:", err);
        }
      }
      finalImageUrl = null;
    } else if (input.imageUrl !== existing.imageUrl) {
      const uploaded = await uploadBase64ToR2(input.imageUrl, `service_${businessSlug}`);
      if (existing.imageUrl && existing.imageUrl !== uploaded) {
        try {
          await deleteFromR2(existing.imageUrl);
        } catch (err) {
          console.warn("Failed to delete previous service image from R2:", err);
        }
      }
      finalImageUrl = uploaded || null;
    }
  }

  return prisma.service.update({
    where: { id: input.id },
    data: {
      name: input.name,
      price: input.price,
      duration: input.duration,
      imageUrl: finalImageUrl,
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

  if (service.imageUrl) {
    try {
      await deleteFromR2(service.imageUrl);
    } catch (err) {
      console.warn("Failed to delete service image from R2:", err);
    }
  }

  // Delete all appointments associated with this service to satisfy foreign key constraints
  const appointments = await prisma.appointment.findMany({
    where: { serviceId: service.id },
    select: { id: true },
  });

  if (appointments.length > 0) {
    const appointmentIds = appointments.map((a) => a.id);
    await prisma.appointmentAudit.deleteMany({
      where: { appointmentId: { in: appointmentIds } },
    });
    await prisma.appointment.deleteMany({
      where: { id: { in: appointmentIds } },
    });
  }

  await prisma.service.delete({ where: { id: service.id } });
  return true;
}
