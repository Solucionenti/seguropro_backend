import { NotFoundError } from '@/shared/domain/not-found-error'
import { ValidationError } from '@/shared/domain/validation-error'
import type { CreatePlanInput, Plan, UpdatePlanInput } from '../domain/entities'
import type { PlanRepository } from '../domain/repository'
import type { IPlanService } from '../domain/service'

export class PlanService implements IPlanService {
  constructor(private readonly repo: PlanRepository) {}

  async list(
    page: number,
    pageSize: number,
    active?: boolean,
  ): Promise<{ data: Plan[]; total: number }> {
    return this.repo.findAll(page, pageSize, active)
  }

  async create(input: CreatePlanInput): Promise<Plan> {
    const existing = await this.repo.findByNombre(input.nombre)
    if (existing) {
      throw new ValidationError(`A plan with the name "${input.nombre}" already exists`)
    }
    return this.repo.create(input)
  }

  async getById(id: string): Promise<Plan> {
    const plan = await this.repo.findById(id)
    if (!plan) {
      throw new NotFoundError('Plan', id)
    }
    return plan
  }

  async update(id: string, input: UpdatePlanInput): Promise<Plan> {
    await this.getById(id)
    if (input.nombre) {
      const existing = await this.repo.findByNombre(input.nombre)
      if (existing && existing.id !== id) {
        throw new ValidationError(`A plan with the name "${input.nombre}" already exists`)
      }
    }
    return this.repo.update(id, input)
  }

  async deactivate(id: string): Promise<void> {
    await this.getById(id)
    return this.repo.deactivate(id)
  }
}
