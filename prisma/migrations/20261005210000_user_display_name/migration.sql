ALTER TABLE "User" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';

UPDATE "User"
SET "name" = COALESCE(
    (
        SELECT MIN("Business"."ownerName")
        FROM "Business"
        WHERE LOWER(TRIM("Business"."email")) = "User"."email"
    ),
    ''
);
