import type { Page, Pageable } from '@/shared/domain/pagination'
import type { ArchivoPolizaView } from './entities'

// clienteUserId set means the caller is a CLIENT and the poliza must be theirs
export interface ArchivoPolizaScope {
  polizaId: string
  companyId: string
  clienteUserId?: string
}

export interface UploadArchivoPolizaInput {
  body: ArrayBuffer
  originalName: string
  mimeType: string
  nombre?: string
}

export interface IArchivoPolizaService {
  list(scope: ArchivoPolizaScope, pageable: Pageable): Promise<Page<ArchivoPolizaView>>
  upload(scope: ArchivoPolizaScope, input: UploadArchivoPolizaInput): Promise<ArchivoPolizaView>
  getById(id: string, scope: ArchivoPolizaScope): Promise<ArchivoPolizaView>
  rename(id: string, scope: ArchivoPolizaScope, nombre: string): Promise<ArchivoPolizaView>
  softDelete(id: string, scope: ArchivoPolizaScope): Promise<void>
}
