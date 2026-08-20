import { NotFoundError } from '@/shared/domain/not-found-error'
import type { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { ColumnaKanban } from '../domain/entities'
import type { ColumnaKanbanRepository } from '../domain/repository'
import type {
  CreateColumnaKanbanServiceInput,
  IColumnaKanbanService,
  ListColumnasKanbanFilters,
  UpdateColumnaKanbanServiceInput,
} from '../domain/service'

export class ColumnaKanbanService implements IColumnaKanbanService {
  constructor(private readonly repo: ColumnaKanbanRepository) {}

  async list(pageable: Pageable, filters: ListColumnasKanbanFilters): Promise<Page<ColumnaKanban>> {
    return this.repo.findAll(pageable, filters)
  }

  async create(input: CreateColumnaKanbanServiceInput): Promise<ColumnaKanban> {
    this.validatePrioridad(input.prioridad)
    await this.ensurePrioridadIsAvailable(input.prioridad, input.companyId)

    return this.repo.create(input)
  }

  async getById(id: string, companyId: string): Promise<ColumnaKanban> {
    const columna = await this.repo.findById(id, companyId)
    if (!columna) {
      throw new NotFoundError('ColumnaKanban', id)
    }
    return columna
  }

  async update(
    id: string,
    companyId: string,
    input: UpdateColumnaKanbanServiceInput,
  ): Promise<ColumnaKanban> {
    const current = await this.getById(id, companyId)

    if (input.prioridad !== undefined) {
      this.validatePrioridad(input.prioridad)

      if (input.prioridad !== current.prioridad) {
        return this.repo.updateWithPriorityReorder(
          id,
          companyId,
          current.prioridad,
          input.prioridad,
          input,
        )
      }
    }

    return this.repo.update(id, input)
  }

  async hardDelete(id: string, companyId: string): Promise<void> {
    const current = await this.getById(id, companyId)
    return this.repo.hardDeleteWithPriorityReorder(id, companyId, current.prioridad)
  }

  private validatePrioridad(prioridad: number): void {
    if (!Number.isInteger(prioridad) || prioridad < 1) {
      throw new ValidationError('prioridad must be a positive integer')
    }
  }

  private async ensurePrioridadIsAvailable(
    prioridad: number,
    companyId: string,
    currentId?: string,
  ): Promise<void> {
    const existing = await this.repo.findByPrioridadAndCompany(prioridad, companyId)
    if (existing && existing.id !== currentId) {
      throw new ValidationError(
        `A columna Kanban with prioridad "${prioridad}" already exists in this company`,
      )
    }
  }
}
