import type { Page, Pageable } from '@/shared/domain/pagination'
import type { ArchivoPoliza, CreateArchivoPolizaInput, UpdateArchivoPolizaInput } from './entities'

export interface ArchivoPolizaRepository {
  findAllByPoliza(polizaId: string, pageable: Pageable): Promise<Page<ArchivoPoliza>>
  findByIdForPoliza(id: string, polizaId: string): Promise<ArchivoPoliza | null>
  create(input: CreateArchivoPolizaInput): Promise<ArchivoPoliza>
  update(id: string, input: UpdateArchivoPolizaInput): Promise<ArchivoPoliza>
  softDelete(id: string): Promise<void>
}
