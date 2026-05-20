import type { AseguradoraBasicInfo } from './entities'

export interface AseguradoraProvider {
  findActiveByIdForCompany(id: string, companyId: string): Promise<AseguradoraBasicInfo | null>
}
