export interface PlanStorageProvider {
  findLimitGBForCompany(companyId: string): Promise<number | null>
}
