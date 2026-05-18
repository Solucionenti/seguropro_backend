import { NotFoundError } from '@/shared/domain/not-found-error'
import type { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Ramo } from '../domain/entities'
import type { RamoRepository } from '../domain/repository'
import type {
  CreateRamoServiceInput,
  IRamoService,
  ListRamosFilters,
  UpdateRamoServiceInput,
} from '../domain/service'

export class RamoService implements IRamoService {
  constructor(private readonly repo: RamoRepository) {}

  async list(pageable: Pageable, filters: ListRamosFilters): Promise<Page<Ramo>> {
    return this.repo.findAll(pageable, filters)
  }

  async create(input: CreateRamoServiceInput): Promise<Ramo> {
    const existing = await this.repo.findByNombreAndCompany(input.nombre, input.companyId)
    if (existing) {
      throw new ValidationError(`A ramo with nombre "${input.nombre}" already exists`)
    }
    return this.repo.create({
      companyId: input.companyId,
      nombre: input.nombre,
      descripcion: input.descripcion ?? null,
    })
  }

  async getById(id: string, companyId: string): Promise<Ramo> {
    const ramo = await this.repo.findById(id, companyId)
    if (!ramo) {
      throw new NotFoundError('Ramo', id)
    }
    return ramo
  }

  async update(id: string, companyId: string, input: UpdateRamoServiceInput): Promise<Ramo> {
    await this.getById(id, companyId)

    if (input.nombre !== undefined) {
      const conflict = await this.repo.findByNombreAndCompany(input.nombre, companyId)
      if (conflict && conflict.id !== id) {
        throw new ValidationError(`A ramo with nombre "${input.nombre}" already exists`)
      }
    }

    return this.repo.update(id, input)
  }

  async softDelete(id: string, companyId: string): Promise<void> {
    await this.getById(id, companyId)
    return this.repo.softDelete(id)
  }
}
