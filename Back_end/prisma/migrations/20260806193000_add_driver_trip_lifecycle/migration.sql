ALTER TABLE "User"
ADD COLUMN "reputationDriverCancelledTrips" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Trip"
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "driverCancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelledByDriverId" TEXT;

CREATE INDEX "Trip_cancelledByDriverId_driverCancelledAt_idx"
ON "Trip"("cancelledByDriverId", "driverCancelledAt");
