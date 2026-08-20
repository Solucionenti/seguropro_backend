-- CreateEnum
CREATE TYPE "SiniestroStatus" AS ENUM ('REPORTADO', 'EN_REVISION', 'APROBADO', 'RECHAZADO', 'PAGADO', 'CERRADO');

-- CreateTable
CREATE TABLE "siniestros" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "polizaId" TEXT NOT NULL,
    "clienteUserId" TEXT NOT NULL,
    "creadoPorUserId" TEXT NOT NULL,
    "tipoSiniestro" TEXT,
    "fechaEvento" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "ajustador" TEXT,
    "montoEstimado" DOUBLE PRECISION,
    "montoPagado" DOUBLE PRECISION,
    "siniestroStatus" "SiniestroStatus" NOT NULL DEFAULT 'REPORTADO',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "siniestros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archivos_polizas" (
    "id" TEXT NOT NULL,
    "polizaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamanoBytes" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "archivos_polizas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "siniestros_companyId_polizaId_idx" ON "siniestros"("companyId", "polizaId");

-- CreateIndex
CREATE INDEX "siniestros_companyId_clienteUserId_idx" ON "siniestros"("companyId", "clienteUserId");

-- CreateIndex
CREATE INDEX "archivos_polizas_polizaId_idx" ON "archivos_polizas"("polizaId");

-- AddForeignKey
ALTER TABLE "siniestros" ADD CONSTRAINT "siniestros_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siniestros" ADD CONSTRAINT "siniestros_polizaId_fkey" FOREIGN KEY ("polizaId") REFERENCES "polizas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siniestros" ADD CONSTRAINT "siniestros_clienteUserId_fkey" FOREIGN KEY ("clienteUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siniestros" ADD CONSTRAINT "siniestros_creadoPorUserId_fkey" FOREIGN KEY ("creadoPorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos_polizas" ADD CONSTRAINT "archivos_polizas_polizaId_fkey" FOREIGN KEY ("polizaId") REFERENCES "polizas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
