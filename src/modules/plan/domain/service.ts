import type { Page, Pageable } from '@/shared/domain/pagination'
import type { CreatePlanInput, Plan, UpdatePlanInput } from './entities'
import type { PlanFilters } from './repository'

export interface IPlanService {
  list(pageable: Pageable, filters?: PlanFilters): Promise<Page<Plan>>
  create(input: CreatePlanInput): Promise<Plan>
  getById(id: string): Promise<Plan>
  getActiveById(id: string): Promise<Plan>
  update(id: string, input: UpdatePlanInput): Promise<Plan>
  deactivate(id: string): Promise<void>
}
