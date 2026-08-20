/*
  Warnings:

  - You are about to drop the column `url` on the `archivos_polizas` table. All the data in the column will be lost.
  - Added the required column `storageKey` to the `archivos_polizas` table without a default value. This is not possible if the table is not empty.
  - Made the column `tamanoBytes` on table `archivos_polizas` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "archivos_polizas" DROP COLUMN "url",
ADD COLUMN     "storageKey" TEXT NOT NULL,
ALTER COLUMN "tamanoBytes" SET NOT NULL;
