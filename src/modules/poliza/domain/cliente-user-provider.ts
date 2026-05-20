import type { ClienteBasicInfo } from './entities'

export interface ClienteUserProvider {
  findActiveClientForCompany(userId: string, companyId: string): Promise<ClienteBasicInfo | null>
}
