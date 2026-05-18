import type { Page, Pageable } from '@/shared/domain/pagination'
import type { Aseguradora, CreateAseguradoraInput, UpdateAseguradoraInput } from './entities'

export interface AseguradoraFilters {
  companyId: string
  nombre?: string
}

export interface AseguradoraRepository {
  findAll(pageable: Pageable, filters: AseguradoraFilters): Promise<Page<Aseguradora>>
  findById(id: string, companyId: string): Promise<Aseguradora | null>
  findByNombreAndCompany(nombre: string, companyId: string): Promise<Aseguradora | null>
  create(input: CreateAseguradoraInput): Promise<Aseguradora>
  update(id: string, input: UpdateAseguradoraInput): Promise<Aseguradora>
  softDelete(id: string): Promise<void>
}
