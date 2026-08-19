import { NotFoundError } from '@/shared/domain/not-found-error'
import type { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { TareaKanbanColumnaProvider } from '../domain/columna-kanban-provider'
import type { TareaKanban } from '../domain/entities'
import type { TareaKanbanPolizaProvider } from '../domain/poliza-provider'
import type { TareaKanbanRepository } from '../domain/repository'
import type {
  CreateTareaKanbanServiceInput,
  ITareaKanbanService,
  ListTareasKanbanFilters,
  UpdateTareaKanbanServiceInput,
} from '../domain/service'

export class TareaKanbanService implements ITareaKanbanService {
  constructor(
    private readonly repo: TareaKanbanRepository,
    private readonly columnaProvider: TareaKanbanColumnaProvider,
    private readonly polizaProvider: TareaKanbanPolizaProvider,
  ) {}

  async list(pageable: Pageable, filters: ListTareasKanbanFilters): Promise<Page<TareaKanban>> {
    return this.repo.findAll(pageable, filters)
  }

  async create(input: CreateTareaKanbanServiceInput): Promise<TareaKanban> {
    await this.validateRelations(
      input.companyId,
      input.columnaKanbanId ?? null,
      input.polizaId ?? null,
    )

    return this.repo.create({
      companyId: input.companyId,
      columnaKanbanId: input.columnaKanbanId ?? null,
      polizaId: input.polizaId ?? null,
      titulo: input.titulo,
      descripcion: input.descripcion ?? null,
    })
  }

  async getById(id: string, companyId: string): Promise<TareaKanban> {
    const tarea = await this.repo.findById(id, companyId)
    if (!tarea) {
      throw new NotFoundError('TareaKanban', id)
    }
    return tarea
  }

  async update(
    id: string,
    companyId: string,
    input: UpdateTareaKanbanServiceInput,
  ): Promise<TareaKanban> {
    await this.getById(id, companyId)

    if (input.columnaKanbanId !== undefined || input.polizaId !== undefined) {
      await this.validateRelations(
        companyId,
        input.columnaKanbanId ?? null,
        input.polizaId ?? null,
        input.columnaKanbanId === undefined,
        input.polizaId === undefined,
      )
    }

    return this.repo.update(id, input)
  }

  async hardDelete(id: string, companyId: string): Promise<void> {
    await this.getById(id, companyId)
    return this.repo.hardDelete(id)
  }

  private async validateRelations(
    companyId: string,
    columnaKanbanId: string | null,
    polizaId: string | null,
    skipColumn = false,
    skipPoliza = false,
  ): Promise<void> {
    if (!skipColumn && columnaKanbanId !== null) {
      const exists = await this.columnaProvider.findActiveByIdForCompany(columnaKanbanId, companyId)
      if (!exists) {
        throw new ValidationError('Kanban column not found for this company')
      }
    }

    if (!skipPoliza && polizaId !== null) {
      const exists = await this.polizaProvider.findActiveByIdForCompany(polizaId, companyId)
      if (!exists) {
        throw new ValidationError('Poliza not found for this company')
      }
    }
  }
}
