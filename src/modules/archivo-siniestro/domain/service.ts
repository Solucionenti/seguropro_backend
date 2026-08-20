import type { Page, Pageable } from '@/shared/domain/pagination'
import type { ArchivoSiniestroView } from './entities'

// clienteUserId set means the caller is a CLIENT and the siniestro must be theirs
export interface ArchivoSiniestroScope {
  siniestroId: string
  companyId: string
  clienteUserId?: string
}

export interface UploadArchivoSiniestroInput {
  body: ArrayBuffer
  originalName: string
  mimeType: string
  nombre?: string
}

export interface IArchivoSiniestroService {
  list(scope: ArchivoSiniestroScope, pageable: Pageable): Promise<Page<ArchivoSiniestroView>>
  upload(
    scope: ArchivoSiniestroScope,
    input: UploadArchivoSiniestroInput,
  ): Promise<ArchivoSiniestroView>
  getById(id: string, scope: ArchivoSiniestroScope): Promise<ArchivoSiniestroView>
  rename(id: string, scope: ArchivoSiniestroScope, nombre: string): Promise<ArchivoSiniestroView>
  softDelete(id: string, scope: ArchivoSiniestroScope): Promise<void>
}
