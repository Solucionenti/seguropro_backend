import { NotFoundError } from '@/shared/domain/not-found-error'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Aseguradora } from '../domain/entities'
import type { AseguradoraRepository } from '../domain/repository'
import type {
  CreateAseguradoraServiceInput,
  IAseguradoraService,
  ListAseguradorasInput,
  UpdateAseguradoraServiceInput,
} from '../domain/service'

export class AseguradoraService implements IAseguradoraService {
  constructor(private readonly repo: AseguradoraRepository) {}

  async list(input: ListAseguradorasInput): Promise<{ data: Aseguradora[]; total: number }> {
    return this.repo.findAll(input.companyId, input.page, input.pageSize, input.nombre)
  }

  async create(input: CreateAseguradoraServiceInput): Promise<Aseguradora> {
    const existing = await this.repo.findByNombreAndCompany(input.nombre, input.companyId)
    if (existing) {
      throw new ValidationError(`An aseguradora with nombre "${input.nombre}" already exists`)
    }
    return this.repo.create({
      companyId: input.companyId,
      nombre: input.nombre,
      descripcion: input.descripcion ?? null,
    })
  }

  async getById(id: string, companyId: string): Promise<Aseguradora> {
    const aseguradora = await this.repo.findById(id, companyId)
    if (!aseguradora) {
      throw new NotFoundError('Aseguradora', id)
    }
    return aseguradora
  }

  async update(
    id: string,
    companyId: string,
    input: UpdateAseguradoraServiceInput,
  ): Promise<Aseguradora> {
    await this.getById(id, companyId)

    if (input.nombre !== undefined) {
      const conflict = await this.repo.findByNombreAndCompany(input.nombre, companyId)
      if (conflict && conflict.id !== id) {
        throw new ValidationError(`An aseguradora with nombre "${input.nombre}" already exists`)
      }
    }

    return this.repo.update(id, input)
  }

  async softDelete(id: string, companyId: string): Promise<void> {
    await this.getById(id, companyId)
    return this.repo.softDelete(id)
  }
}
