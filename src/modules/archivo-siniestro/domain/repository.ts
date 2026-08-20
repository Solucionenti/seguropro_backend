import type { Page, Pageable } from '@/shared/domain/pagination'
import type {
  ArchivoSiniestro,
  CreateArchivoSiniestroInput,
  UpdateArchivoSiniestroInput,
} from './entities'

export interface ArchivoSiniestroRepository {
  findAllBySiniestro(siniestroId: string, pageable: Pageable): Promise<Page<ArchivoSiniestro>>
  findByIdForSiniestro(id: string, siniestroId: string): Promise<ArchivoSiniestro | null>
  create(input: CreateArchivoSiniestroInput): Promise<ArchivoSiniestro>
  update(id: string, input: UpdateArchivoSiniestroInput): Promise<ArchivoSiniestro>
  softDelete(id: string): Promise<void>
}
