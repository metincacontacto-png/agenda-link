ALTER TABLE "Appointment" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Appointment" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "paymentAmount" REAL;
