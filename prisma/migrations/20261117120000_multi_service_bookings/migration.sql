ALTER TABLE "Business" ADD COLUMN "maxServicesPerBooking" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Appointment" ADD COLUMN "durationMinutes" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "servicesJson" TEXT;
