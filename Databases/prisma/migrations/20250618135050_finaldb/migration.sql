/*
  Warnings:

  - Added the required column `restaurantId` to the `Items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Menu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Menu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Menu` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Items" ADD COLUMN     "restaurantId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Menu" ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;

-- AddForeignKey
ALTER TABLE "Items" ADD CONSTRAINT "Items_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
