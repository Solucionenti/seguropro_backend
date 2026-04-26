import type { CreatePlanInput, Plan, UpdatePlanInput } from './entities'

export interface PlanRepository {
  findAll(
    page: number,
    pageSize: number,
    active?: boolean,
  ): Promise<{ data: Plan[]; total: number }>
  findById(id: string): Promise<Plan | null>
  findByNombre(nombre: string): Promise<Plan | null>
  create(input: CreatePlanInput): Promise<Plan>
  update(id: string, input: UpdatePlanInput): Promise<Plan>
  deactivate(id: string): Promise<void>
}
