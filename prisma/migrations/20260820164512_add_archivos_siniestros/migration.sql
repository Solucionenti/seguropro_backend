-- CreateTable
CREATE TABLE "archivos_siniestros" (
    "id" TEXT NOT NULL,
    "siniestroId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "archivos_siniestros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "archivos_siniestros_siniestroId_idx" ON "archivos_siniestros"("siniestroId");

-- AddForeignKey
ALTER TABLE "archivos_siniestros" ADD CONSTRAINT "archivos_siniestros_siniestroId_fkey" FOREIGN KEY ("siniestroId") REFERENCES "siniestros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
