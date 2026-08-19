import type { Page, Pageable } from '@/shared/domain/pagination'
import type { ArchivoPoliza } from './entities'

/**
 * `clienteUserId` presente = la petición viene de un CLIENT y la póliza debe ser suya.
 */
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
