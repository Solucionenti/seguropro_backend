import type { CreatePlanInput, Plan, UpdatePlanInput } from './entities'

export interface IPlanService {
  list(page: number, pageSize: number, active?: boolean): Promise<{ data: Plan[]; total: number }>
  create(input: CreatePlanInput): Promise<Plan>
  getById(id: string): Promise<Plan>
  update(id: string, input: UpdatePlanInput): Promise<Plan>
  deactivate(id: string): Promise<void>
}
