export interface TareaKanbanColumnaProvider {
  findActiveByIdForCompany(id: string, companyId: string): Promise<boolean>
}
