import type { Aseguradora, CreateAseguradoraInput, UpdateAseguradoraInput } from './entities'

export interface AseguradoraRepository {
  findAll(
    companyId: string,
    page: number,
    pageSize: number,
    nombre?: string,
  ): Promise<{ data: Aseguradora[]; total: number }>
  findById(id: string, companyId: string): Promise<Aseguradora | null>
  findByNombreAndCompany(nombre: string, companyId: string): Promise<Aseguradora | null>
  create(input: CreateAseguradoraInput): Promise<Aseguradora>
  update(id: string, input: UpdateAseguradoraInput): Promise<Aseguradora>
  softDelete(id: string): Promise<void>
}
