/*
  Warnings:

  - Added the required column `title` to the `SavedTrip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SavedTrip" ADD COLUMN     "icon" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SavedPlace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "icon" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedPlace_userId_createdAt_idx" ON "SavedPlace"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SavedTrip_userId_createdAt_idx" ON "SavedTrip"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "SavedPlace" ADD CONSTRAINT "SavedPlace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
