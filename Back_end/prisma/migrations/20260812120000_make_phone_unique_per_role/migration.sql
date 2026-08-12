-- A phone number identifies one account per role, so the same person can have
-- one client account and one driver account without making either account ambiguous.
DROP INDEX "User_phone_key";
CREATE UNIQUE INDEX "User_phone_role_key" ON "User"("phone", "role");

ALTER TABLE "OtpCode" ADD COLUMN "role" "Role";
UPDATE "OtpCode"
SET "role" = "User"."role"
FROM "User"
WHERE "OtpCode"."phone" = "User"."phone";
UPDATE "OtpCode" SET "role" = 'CLIENT' WHERE "role" IS NULL;
ALTER TABLE "OtpCode" ALTER COLUMN "role" SET NOT NULL;

DROP INDEX "OtpCode_phone_purpose_createdAt_idx";
CREATE INDEX "OtpCode_phone_role_purpose_createdAt_idx" ON "OtpCode"("phone", "role", "purpose", "createdAt");
