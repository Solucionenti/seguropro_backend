import type { SiniestroBasicInfo } from './entities'

export interface SiniestroProvider {
  findActiveByIdForCompany(id: string, companyId: string): Promise<SiniestroBasicInfo | null>
}
