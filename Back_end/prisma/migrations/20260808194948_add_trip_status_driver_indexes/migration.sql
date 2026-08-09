-- CreateIndex
CREATE INDEX "Trip_status_createdAt_idx" ON "Trip"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Trip_driverId_status_idx" ON "Trip"("driverId", "status");
