/*
  Warnings:

  - You are about to drop the column `deliveryTime` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `pickupTime` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Delivery` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orderId]` on the table `Delivery` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deliveryPersonId` to the `Delivery` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_userId_fkey";

-- AlterTable
ALTER TABLE "Delivery" DROP COLUMN "deliveryTime",
DROP COLUMN "pickupTime",
DROP COLUMN "userId",
ADD COLUMN     "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryPersonId" INTEGER NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "pickedUpAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Menu" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "confirmationCode" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryPersonId" INTEGER,
ADD COLUMN     "qrCode" TEXT,
ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_deliveryPersonId_fkey" FOREIGN KEY ("deliveryPersonId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
