-- CreateTable
CREATE TABLE "columnas_kanban" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "prioridad" INTEGER NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "columnas_kanban_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "polizas" ADD COLUMN "kanbanId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "columnas_kanban_companyId_prioridad_key" ON "columnas_kanban"("companyId", "prioridad");

-- CreateIndex
CREATE INDEX "columnas_kanban_companyId_nombre_idx" ON "columnas_kanban"("companyId", "nombre");

-- CreateIndex
CREATE INDEX "polizas_companyId_kanbanId_idx" ON "polizas"("companyId", "kanbanId");

-- AddForeignKey
ALTER TABLE "columnas_kanban" ADD CONSTRAINT "columnas_kanban_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polizas" ADD CONSTRAINT "polizas_kanbanId_fkey" FOREIGN KEY ("kanbanId") REFERENCES "columnas_kanban"("id") ON DELETE SET NULL ON UPDATE CASCADE;
