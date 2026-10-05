-- Introduce user identity and explicit business membership.
-- Existing businesses with an email are linked to a password-less user so
-- credentials can be provisioned through the documented manual reset process.
-- Businesses without an email remain untouched and must be associated manually.

CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "globalRole" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "BusinessMember" (
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("businessId", "userId"),
    CONSTRAINT "BusinessMember_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BusinessMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "BusinessMember_userId_idx" ON "BusinessMember"("userId");

-- Normalize stored addresses and merge businesses sharing one owner email.
INSERT INTO "User" ("id", "email", "passwordHash", "globalRole", "createdAt", "updatedAt")
SELECT
    LOWER(HEX(RANDOMBLOB(16))),
    LOWER(TRIM("email")),
    NULL,
    'USER',
    MIN("createdAt"),
    MIN("createdAt")
FROM "Business"
WHERE "email" IS NOT NULL AND TRIM("email") <> ''
GROUP BY LOWER(TRIM("email"));

INSERT INTO "BusinessMember" ("businessId", "userId", "role")
SELECT
    business."id",
    user."id",
    'OWNER'
FROM "Business" AS business
JOIN "User" AS user ON user."email" = LOWER(TRIM(business."email"))
WHERE business."email" IS NOT NULL AND TRIM(business."email") <> '';
