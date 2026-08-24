import { NotFoundError } from '@/shared/domain/not-found-error'
import type { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Glosario } from '../domain/entities'
import type { GlosarioRepository } from '../domain/repository'
import type {
  CreateGlosarioServiceInput,
  IGlosarioService,
  ListGlosariosFilters,
  UpdateGlosarioServiceInput,
} from '../domain/service'

export class GlosarioService implements IGlosarioService {
  constructor(private readonly repo: GlosarioRepository) {}

  async list(pageable: Pageable, filters: ListGlosariosFilters): Promise<Page<Glosario>> {
    return this.repo.findAll(pageable, filters)
  }

  async create(input: CreateGlosarioServiceInput): Promise<Glosario> {
    await this.assertTituloLibre(input.titulo, input.companyId)

    return this.repo.create({
      companyId: input.companyId,
      titulo: input.titulo,
      descripcion: input.descripcion,
    })
  }

  async getById(id: string, companyId: string): Promise<Glosario> {
    const glosario = await this.repo.findById(id, companyId)
    if (!glosario) {
      throw new NotFoundError('Glosario', id)
    }
    return glosario
  }

  async update(
    id: string,
    companyId: string,
    input: UpdateGlosarioServiceInput,
  ): Promise<Glosario> {
    await this.getById(id, companyId)

    if (input.titulo !== undefined) {
      await this.assertTituloLibre(input.titulo, companyId, id)
    }

    return this.repo.update(id, input)
  }

  async softDelete(id: string, companyId: string): Promise<void> {
    await this.getById(id, companyId)
    return this.repo.softDelete(id)
  }

  // unique per company, never globally
  private async assertTituloLibre(
    titulo: string,
    companyId: string,
    exceptoId?: string,
  ): Promise<void> {
    const existing = await this.repo.findByTituloAndCompany(titulo, companyId)
    if (existing && existing.id !== exceptoId) {
      throw new ValidationError(`A glosario term with titulo "${titulo}" already exists`)
    }
  }
}
