import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import type { TareaKanbanColumnaProvider } from '../domain/columna-kanban-provider'

export class PrismaTareaKanbanColumnaProvider implements TareaKanbanColumnaProvider {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findActiveByIdForCompany(id: string, companyId: string): Promise<boolean> {
    const columna = await this.prisma.columnaKanban.findFirst({
      where: { id, companyId, status: ResourceStatus.ACTIVE },
      select: { id: true },
    })
    return columna !== null
  }
}
