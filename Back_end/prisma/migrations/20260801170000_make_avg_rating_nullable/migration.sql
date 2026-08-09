ALTER TABLE "User" ALTER COLUMN "avgRating" DROP DEFAULT;

UPDATE "User" AS users
SET "avgRating" = (
  SELECT AVG(rates."rateStars")::DOUBLE PRECISION
  FROM "Rate" AS rates
  WHERE rates."ratedId" = users."id"
);
