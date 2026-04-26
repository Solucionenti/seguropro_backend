import type { CompanyBasicInfo } from './entities'

export interface CompanyProvider {
  findActiveById(id: string): Promise<CompanyBasicInfo | null>
}
