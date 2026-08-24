-- CreateEnum
CREATE TYPE "HitoStatus" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'VENCIDO', 'CANCELADO');

-- AlterTable
ALTER TABLE "polizas" ADD COLUMN     "creadoPorUserId" TEXT,
ADD COLUMN     "polizaAnteriorId" TEXT,
ALTER COLUMN "numeroPoliza" DROP NOT NULL,
ALTER COLUMN "fechaInicio" DROP NOT NULL,
ALTER COLUMN "fechaVencimiento" DROP NOT NULL;

-- CreateTable
CREATE TABLE "hitos_siniestros" (
    "id" TEXT NOT NULL,
    "siniestroId" TEXT NOT NULL,
    "tarea" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "alerta" BOOLEAN NOT NULL DEFAULT true,
    "hitoStatus" "HitoStatus" NOT NULL DEFAULT 'PENDIENTE',
    "asignadoAUserId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hitos_siniestros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hitos_siniestros_siniestroId_idx" ON "hitos_siniestros"("siniestroId");

-- CreateIndex
CREATE INDEX "hitos_siniestros_fechaLimite_hitoStatus_idx" ON "hitos_siniestros"("fechaLimite", "hitoStatus");

-- AddForeignKey
ALTER TABLE "polizas" ADD CONSTRAINT "polizas_polizaAnteriorId_fkey" FOREIGN KEY ("polizaAnteriorId") REFERENCES "polizas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polizas" ADD CONSTRAINT "polizas_creadoPorUserId_fkey" FOREIGN KEY ("creadoPorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hitos_siniestros" ADD CONSTRAINT "hitos_siniestros_siniestroId_fkey" FOREIGN KEY ("siniestroId") REFERENCES "siniestros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hitos_siniestros" ADD CONSTRAINT "hitos_siniestros_asignadoAUserId_fkey" FOREIGN KEY ("asignadoAUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
