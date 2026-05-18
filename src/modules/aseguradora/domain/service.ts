import type { Aseguradora } from './entities'

export interface ListAseguradorasInput {
  companyId: string
  page: number
  pageSize: number
  nombre?: string
}

export interface CreateAseguradoraServiceInput {
  companyId: string
  nombre: string
  descripcion?: string | null
}

export interface UpdateAseguradoraServiceInput {
  nombre?: string
  descripcion?: string | null
}

export interface IAseguradoraService {
  list(input: ListAseguradorasInput): Promise<{ data: Aseguradora[]; total: number }>
  create(input: CreateAseguradoraServiceInput): Promise<Aseguradora>
  getById(id: string, companyId: string): Promise<Aseguradora>
  update(id: string, companyId: string, input: UpdateAseguradoraServiceInput): Promise<Aseguradora>
  softDelete(id: string, companyId: string): Promise<void>
}
