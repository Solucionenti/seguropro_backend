import type { Page, Pageable } from '@/shared/domain/pagination'
import type { Ramo } from './entities'

export interface ListRamosFilters {
  companyId: string
  nombre?: string
}

export interface CreateRamoServiceInput {
  companyId: string
  nombre: string
  descripcion?: string | null
}

export interface UpdateRamoServiceInput {
  nombre?: string
  descripcion?: string | null
}

export interface IRamoService {
  list(pageable: Pageable, filters: ListRamosFilters): Promise<Page<Ramo>>
  create(input: CreateRamoServiceInput): Promise<Ramo>
  getById(id: string, companyId: string): Promise<Ramo>
  update(id: string, companyId: string, input: UpdateRamoServiceInput): Promise<Ramo>
  softDelete(id: string, companyId: string): Promise<void>
}
