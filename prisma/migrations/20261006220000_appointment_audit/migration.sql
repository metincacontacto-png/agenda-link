ALTER TABLE "Appointment" ADD COLUMN "updatedAt" DATETIME;
ALTER TABLE "Appointment" ADD COLUMN "lastModifiedBy" TEXT;

UPDATE "Appointment" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

CREATE TABLE "AppointmentAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "eventType" TEXT NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "previousDateTime" DATETIME NOT NULL,
    "newDateTime" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppointmentAudit_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AppointmentAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AppointmentAudit_appointmentId_createdAt_idx" ON "AppointmentAudit"("appointmentId", "createdAt");
CREATE INDEX "AppointmentAudit_actorUserId_createdAt_idx" ON "AppointmentAudit"("actorUserId", "createdAt");

CREATE TRIGGER "Appointment_audit_after_update"
AFTER UPDATE OF "status", "dateTime" ON "Appointment"
WHEN OLD."status" <> NEW."status" OR OLD."dateTime" <> NEW."dateTime"
BEGIN
    INSERT INTO "AppointmentAudit" (
        "id", "appointmentId", "actorUserId", "eventType",
        "previousStatus", "newStatus", "previousDateTime", "newDateTime", "createdAt"
    ) VALUES (
        LOWER(HEX(RANDOMBLOB(16))),
        NEW."id",
        NEW."lastModifiedBy",
        CASE
            WHEN NEW."status" = 'CANCELLED' THEN 'CANCELLED'
            WHEN OLD."dateTime" <> NEW."dateTime" THEN 'RESCHEDULED'
            ELSE 'STATUS_CHANGED'
        END,
        OLD."status",
        NEW."status",
        OLD."dateTime",
        NEW."dateTime",
        COALESCE(NEW."updatedAt", CURRENT_TIMESTAMP)
    );
END;
