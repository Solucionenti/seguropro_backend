-- CreateEnum
CREATE TYPE "Periodicidad" AS ENUM ('MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "SuscripcionStatus" AS ENUM ('TRIAL', 'ACTIVA', 'CANCELADA', 'VENCIDA', 'SUSPENDIDA');

-- CreateEnum
CREATE TYPE "OrdenStatus" AS ENUM ('PENDIENTE', 'PAGADA', 'FALLIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "periodicidad" "Periodicidad" NOT NULL,
    "limiteUsuarios" INTEGER NOT NULL,
    "limiteAlmacenamientoGB" DOUBLE PRECISION,
    "features" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "suscripcionStatus" "SuscripcionStatus" NOT NULL DEFAULT 'TRIAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "fechaProximoPago" TIMESTAMP(3) NOT NULL,
    "renovacionAutomatica" BOOLEAN NOT NULL DEFAULT true,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes" (
    "id" TEXT NOT NULL,
    "suscripcionId" TEXT NOT NULL,
    "cicloInicio" TIMESTAMP(3) NOT NULL,
    "cicloFin" TIMESTAMP(3) NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "ordenStatus" "OrdenStatus" NOT NULL DEFAULT 'PENDIENTE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "proveedor" TEXT,
    "proveedorOrdenId" TEXT,
    "proveedorPagoId" TEXT,
    "pagadaEn" TIMESTAMP(3),
    "motivoFallo" TEXT,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_nombre_key" ON "plans"("nombre");

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_suscripcionId_fkey" FOREIGN KEY ("suscripcionId") REFERENCES "suscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
