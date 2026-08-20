export interface TareaKanbanPolizaProvider {
  findActiveByIdForCompany(id: string, companyId: string): Promise<boolean>
}
