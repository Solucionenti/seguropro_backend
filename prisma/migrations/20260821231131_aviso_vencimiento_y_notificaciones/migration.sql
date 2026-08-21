-- CreateEnum
CREATE TYPE "NotificacionTipo" AS ENUM ('POLIZA_POR_VENCER', 'HITO_ALERTA');

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "avisoVencimientoDias" INTEGER[] DEFAULT ARRAY[30, 15, 7]::INTEGER[];

-- CreateTable
CREATE TABLE "notificaciones_enviadas" (
    "id" TEXT NOT NULL,
    "tipo" "NotificacionTipo" NOT NULL,
    "entidadId" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "enviadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificaciones_enviadas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificaciones_enviadas_tipo_enviadoEn_idx" ON "notificaciones_enviadas"("tipo", "enviadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "notificaciones_enviadas_tipo_entidadId_marca_key" ON "notificaciones_enviadas"("tipo", "entidadId", "marca");
