ALTER TABLE "Business" ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIALING';
ALTER TABLE "Business" ADD COLUMN "trialEndsAt" DATETIME;
ALTER TABLE "Business" ADD COLUMN "subscriptionId" TEXT;
ALTER TABLE "Business" ADD COLUMN "subscriptionPlan" TEXT;
ALTER TABLE "Business" ADD COLUMN "currentPeriodEnd" DATETIME;

-- Inicializar trialEndsAt para negocios existentes (14 dias desde su creacion)
UPDATE "Business" SET "trialEndsAt" = datetime("createdAt", '+14 days') WHERE "trialEndsAt" IS NULL;
