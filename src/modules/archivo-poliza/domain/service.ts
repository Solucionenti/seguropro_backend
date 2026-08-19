import type { Page, Pageable } from '@/shared/domain/pagination'
import type { ArchivoPoliza } from './entities'

// clienteUserId set means the caller is a CLIENT and the poliza must be theirs
export interface ArchivoPolizaScope {
  polizaId: string
  companyId: string
  clienteUserId?: string
}

export interface CreateArchivoPolizaServiceInput {
  nombre: string
  mimeType: string
  url: string
  tamanoBytes?: number
}

export interface UpdateArchivoPolizaServiceInput {
  nombre?: string
  mimeType?: string
  url?: string
  tamanoBytes?: number
}

export interface IArchivoPolizaService {
  list(scope: ArchivoPolizaScope, pageable: Pageable): Promise<Page<ArchivoPoliza>>
  create(scope: ArchivoPolizaScope, input: CreateArchivoPolizaServiceInput): Promise<ArchivoPoliza>
  getById(id: string, scope: ArchivoPolizaScope): Promise<ArchivoPoliza>
  update(
    id: string,
    scope: ArchivoPolizaScope,
    input: UpdateArchivoPolizaServiceInput,
  ): Promise<ArchivoPoliza>
  softDelete(id: string, scope: ArchivoPolizaScope): Promise<void>
}
