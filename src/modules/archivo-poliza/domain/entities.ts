import type { ArchivoPolizaModel } from '@gen/models/ArchivoPoliza'
import type { PolizaModel } from '@gen/models/Poliza'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface ArchivoPoliza
  extends BaseEntity,
    Pick<
      ArchivoPolizaModel,
      'polizaId' | 'nombre' | 'mimeType' | 'storageKey' | 'tamanoBytes' | 'active'
    > {}

// what the api returns: the storageKey never leaves the backend, the url is signed on read
export type ArchivoPolizaView = Omit<ArchivoPoliza, 'storageKey'> & { url: string }

export type PolizaBasicInfo = Pick<PolizaModel, 'id' | 'companyId' | 'clienteUserId'>

export type CreateArchivoPolizaInput = Pick<
  ArchivoPolizaModel,
  'polizaId' | 'nombre' | 'mimeType' | 'storageKey' | 'tamanoBytes'
>

export type UpdateArchivoPolizaInput = Partial<Pick<ArchivoPolizaModel, 'nombre'>>
