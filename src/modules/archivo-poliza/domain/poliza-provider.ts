import type { PolizaBasicInfo } from './entities'

export interface PolizaProvider {
  findActiveByIdForCompany(id: string, companyId: string): Promise<PolizaBasicInfo | null>
}
