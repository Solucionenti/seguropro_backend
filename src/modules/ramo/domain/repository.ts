import type { Page, Pageable } from '@/shared/domain/pagination'
import type { CreateRamoInput, Ramo, UpdateRamoInput } from './entities'

export interface RamoFilters {
  companyId: string
  nombre?: string
}

export interface RamoRepository {
  findAll(pageable: Pageable, filters: RamoFilters): Promise<Page<Ramo>>
  findById(id: string, companyId: string): Promise<Ramo | null>
  findByNombreAndCompany(nombre: string, companyId: string): Promise<Ramo | null>
  create(input: CreateRamoInput): Promise<Ramo>
  update(id: string, input: UpdateRamoInput): Promise<Ramo>
  softDelete(id: string): Promise<void>
}
