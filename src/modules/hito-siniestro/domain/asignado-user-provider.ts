import type { AsignadoBasicInfo } from './entities'

export interface AsignadoUserProvider {
  findAssignableForCompany(userId: string, companyId: string): Promise<AsignadoBasicInfo | null>
}
