import type { PlanBasicInfo } from './entities'

export interface PlanProvider {
  findActiveById(id: string): Promise<PlanBasicInfo | null>
}
