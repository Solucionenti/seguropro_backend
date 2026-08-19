import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { ColumnaKanbanBasicInfo } from '../domain/entities'
import type { KanbanProvider } from '../domain/kanban-provider'

export class PrismaKanbanProvider implements KanbanProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findActiveByIdForCompany(
    id: string,
    companyId: string,
  ): Promise<ColumnaKanbanBasicInfo | null> {
    return this.prisma.columnaKanban.findFirst({
      where: { id, companyId, status: ResourceStatus.ACTIVE },
      select: { id: true, companyId: true, nombre: true, prioridad: true },
    })
  }
}
