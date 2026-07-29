/*
  Warnings:

  - You are about to drop the column `read` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Notification` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fromUserId,shiftId]` on the table `Rating` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `recipientId` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "read",
DROP COLUMN "userId",
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "recipientId" INTEGER NOT NULL,
ADD COLUMN     "relatedId" INTEGER,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'info';

-- AlterTable
ALTER TABLE "Rating" ADD COLUMN     "shiftId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Rating_fromUserId_shiftId_key" ON "Rating"("fromUserId", "shiftId");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
