import type { Page, Pageable } from '@/shared/domain/pagination'
import type { CreatePlanInput, Plan, UpdatePlanInput } from './entities'

export interface PlanFilters {
  active?: boolean
}

export interface PlanRepository {
  findAll(pageable: Pageable, filters?: PlanFilters): Promise<Page<Plan>>
  findById(id: string): Promise<Plan | null>
  findCompleteById(id: string): Promise<Plan | null>
  findByNombre(nombre: string): Promise<Plan | null>
  create(input: CreatePlanInput): Promise<Plan>
  update(id: string, input: UpdatePlanInput): Promise<Plan>
  deactivate(id: string): Promise<void>
}
