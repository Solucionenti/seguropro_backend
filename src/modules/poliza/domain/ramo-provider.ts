import type { RamoBasicInfo } from './entities'

export interface RamoProvider {
  findActiveByIdForCompany(id: string, companyId: string): Promise<RamoBasicInfo | null>
}
