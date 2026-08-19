import type { ColumnaKanbanBasicInfo } from './entities'

export interface KanbanProvider {
  findActiveByIdForCompany(id: string, companyId: string): Promise<ColumnaKanbanBasicInfo | null>
}
