-- CreateEnum
CREATE TYPE "PolizaStatus" AS ENUM ('VIGENTE', 'VENCIDA', 'CANCELADA', 'RENOVADA');

-- CreateTable
CREATE TABLE "ramos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ramos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polizas" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "aseguradoraId" TEXT NOT NULL,
    "ramoId" TEXT NOT NULL,
    "clienteUserId" TEXT NOT NULL,
    "numeroPoliza" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "primaNeta" DOUBLE PRECISION NOT NULL,
    "primaTotal" DOUBLE PRECISION NOT NULL,
    "polizaStatus" "PolizaStatus" NOT NULL DEFAULT 'VIGENTE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polizas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ramos_companyId_nombre_key" ON "ramos"("companyId", "nombre");

-- CreateIndex
CREATE INDEX "polizas_companyId_clienteUserId_idx" ON "polizas"("companyId", "clienteUserId");

-- CreateIndex
CREATE UNIQUE INDEX "polizas_companyId_numeroPoliza_key" ON "polizas"("companyId", "numeroPoliza");

-- AddForeignKey
ALTER TABLE "ramos" ADD CONSTRAINT "ramos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polizas" ADD CONSTRAINT "polizas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polizas" ADD CONSTRAINT "polizas_aseguradoraId_fkey" FOREIGN KEY ("aseguradoraId") REFERENCES "aseguradoras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polizas" ADD CONSTRAINT "polizas_ramoId_fkey" FOREIGN KEY ("ramoId") REFERENCES "ramos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polizas" ADD CONSTRAINT "polizas_clienteUserId_fkey" FOREIGN KEY ("clienteUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
