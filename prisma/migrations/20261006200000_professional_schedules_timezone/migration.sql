ALTER TABLE "Business" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Santiago';

CREATE TABLE "BusinessSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    CONSTRAINT "BusinessSchedule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ProfessionalSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "professionalId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    CONSTRAINT "ProfessionalSchedule_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ProfessionalBreak" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "professionalId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "label" TEXT,
    CONSTRAINT "ProfessionalBreak_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ScheduleBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "professionalId" TEXT,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "reason" TEXT,
    CONSTRAINT "ScheduleBlock_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleBlock_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "BusinessSchedule_businessId_dayOfWeek_startMinute_endMinute_key" ON "BusinessSchedule"("businessId", "dayOfWeek", "startMinute", "endMinute");
CREATE INDEX "BusinessSchedule_businessId_dayOfWeek_idx" ON "BusinessSchedule"("businessId", "dayOfWeek");
CREATE UNIQUE INDEX "ProfessionalSchedule_professionalId_dayOfWeek_startMinute_endMinute_key" ON "ProfessionalSchedule"("professionalId", "dayOfWeek", "startMinute", "endMinute");
CREATE INDEX "ProfessionalSchedule_professionalId_dayOfWeek_idx" ON "ProfessionalSchedule"("professionalId", "dayOfWeek");
CREATE INDEX "ProfessionalBreak_professionalId_dayOfWeek_idx" ON "ProfessionalBreak"("professionalId", "dayOfWeek");
CREATE INDEX "ScheduleBlock_businessId_startsAt_endsAt_idx" ON "ScheduleBlock"("businessId", "startsAt", "endsAt");
CREATE INDEX "ScheduleBlock_professionalId_startsAt_endsAt_idx" ON "ScheduleBlock"("professionalId", "startsAt", "endsAt");

-- Preserve existing availability while moving to configurable schedules.
-- Legacy slot generation was 09:00 through 17:30 every day; an 18:00 close
-- allows a final 30-minute slot while professional-specific records are added.
WITH days("dayOfWeek") AS (VALUES (0), (1), (2), (3), (4), (5), (6))
INSERT INTO "BusinessSchedule" ("id", "businessId", "dayOfWeek", "startMinute", "endMinute")
SELECT LOWER(HEX(RANDOMBLOB(16))), business."id", days."dayOfWeek", 540, 1080
FROM "Business" AS business CROSS JOIN days;

WITH days("dayOfWeek") AS (VALUES (0), (1), (2), (3), (4), (5), (6))
INSERT INTO "ProfessionalSchedule" ("id", "professionalId", "dayOfWeek", "startMinute", "endMinute")
SELECT LOWER(HEX(RANDOMBLOB(16))), professional."id", days."dayOfWeek", 540, 1080
FROM "Professional" AS professional CROSS JOIN days;
