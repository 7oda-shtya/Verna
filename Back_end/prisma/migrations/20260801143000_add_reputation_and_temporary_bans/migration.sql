ALTER TABLE "User"
ADD COLUMN "reputationScore" INTEGER,
ADD COLUMN "reputationLabel" TEXT NOT NULL DEFAULT 'مستخدم جديد',
ADD COLUMN "reputationUpdatedAt" TIMESTAMP(3),
ADD COLUMN "reputationCompletedTrips" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "reputationCancelledTrips" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "reputationAcceptedReports" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "banReason" TEXT,
ADD COLUMN "banStartAt" TIMESTAMP(3),
ADD COLUMN "banEndAt" TIMESTAMP(3),
ADD COLUMN "reputationBanEndAt" TIMESTAMP(3),
ADD COLUMN "rapidCancelBanEndAt" TIMESTAMP(3);

ALTER TABLE "Trip"
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "cancelledAt" TIMESTAMP(3);

ALTER TABLE "Report" ADD COLUMN "reviewedAt" TIMESTAMP(3);

CREATE INDEX "Trip_clientId_cancelledAt_idx" ON "Trip"("clientId", "cancelledAt");
CREATE INDEX "Trip_clientId_completedAt_idx" ON "Trip"("clientId", "completedAt");
