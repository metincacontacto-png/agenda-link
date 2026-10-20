ALTER TABLE "Business" ADD COLUMN "cancellationPolicy" TEXT DEFAULT 'Cancelaciones con al menos 24 h de anticipación.';
ALTER TABLE "Business" ADD COLUMN "minNoticeHours" INTEGER NOT NULL DEFAULT 2;
