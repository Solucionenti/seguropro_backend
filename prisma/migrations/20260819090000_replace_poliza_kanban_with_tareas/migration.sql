-- CreateTable
CREATE TABLE "tareas_kanban" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "columnaKanbanId" TEXT,
    "polizaId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tareas_kanban_pkey" PRIMARY KEY ("id")
);

-- Preserve existing direct policy-to-column assignments as Kanban tasks before removing the old column.
WITH legacy_tasks AS (
    SELECT
        p.*,
        md5(random()::text || clock_timestamp()::text) AS generated_id
    FROM "polizas" p
    WHERE p."kanbanId" IS NOT NULL
)
INSERT INTO "tareas_kanban" (
    "id",
    "companyId",
    "columnaKanbanId",
    "polizaId",
    "titulo",
    "descripcion",
    "status",
    "createdAt",
    "updatedAt"
)
SELECT
    substr(generated_id, 1, 8) || '-' || substr(generated_id, 9, 4) || '-' || substr(generated_id, 13, 4) || '-' || substr(generated_id, 17, 4) || '-' || substr(generated_id, 21, 12),
    "companyId",
    "kanbanId",
    "id",
    'Tarea migrada de póliza ' || "numeroPoliza",
    NULL,
    CASE WHEN "status" = 'ACTIVE' AND "active" = true THEN 'ACTIVE' ELSE 'DELETED' END::"ResourceStatus",
    "createdAt",
    "updatedAt"
FROM legacy_tasks;

-- Remove the direct policy-to-column relationship.
ALTER TABLE "polizas" DROP CONSTRAINT "polizas_kanbanId_fkey";
DROP INDEX "polizas_companyId_kanbanId_idx";
ALTER TABLE "polizas" DROP COLUMN "kanbanId";

-- CreateIndex
CREATE INDEX "tareas_kanban_companyId_columnaKanbanId_idx" ON "tareas_kanban"("companyId", "columnaKanbanId");

-- CreateIndex
CREATE INDEX "tareas_kanban_companyId_polizaId_idx" ON "tareas_kanban"("companyId", "polizaId");

-- AddForeignKey
ALTER TABLE "tareas_kanban" ADD CONSTRAINT "tareas_kanban_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas_kanban" ADD CONSTRAINT "tareas_kanban_columnaKanbanId_fkey" FOREIGN KEY ("columnaKanbanId") REFERENCES "columnas_kanban"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas_kanban" ADD CONSTRAINT "tareas_kanban_polizaId_fkey" FOREIGN KEY ("polizaId") REFERENCES "polizas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
