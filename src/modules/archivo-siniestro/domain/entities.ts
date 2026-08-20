import type { ArchivoSiniestroModel } from '@gen/models/ArchivoSiniestro'
import type { SiniestroModel } from '@gen/models/Siniestro'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface ArchivoSiniestro
  extends BaseEntity,
    Pick<
      ArchivoSiniestroModel,
      'siniestroId' | 'nombre' | 'mimeType' | 'storageKey' | 'tamanoBytes' | 'active'
    > {}

// what the api returns: the storageKey never leaves the backend, the url is signed on read
export type ArchivoSiniestroView = Omit<ArchivoSiniestro, 'storageKey'> & { url: string }

export type SiniestroBasicInfo = Pick<SiniestroModel, 'id' | 'companyId' | 'clienteUserId'>

export type CreateArchivoSiniestroInput = Pick<
  ArchivoSiniestroModel,
  'siniestroId' | 'nombre' | 'mimeType' | 'storageKey' | 'tamanoBytes'
>

export type UpdateArchivoSiniestroInput = Partial<Pick<ArchivoSiniestroModel, 'nombre'>>
