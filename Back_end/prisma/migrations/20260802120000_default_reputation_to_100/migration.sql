ALTER TABLE "User" ALTER COLUMN "reputationScore" SET DEFAULT 100;
ALTER TABLE "User" ALTER COLUMN "reputationLabel" SET DEFAULT 'سمعة ممتازة';

UPDATE "User"
SET
  "reputationScore" = 100,
  "reputationLabel" = 'سمعة ممتازة'
WHERE "reputationScore" IS NULL;
