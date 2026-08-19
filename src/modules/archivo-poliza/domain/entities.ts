import type { ArchivoPolizaModel } from '@gen/models/ArchivoPoliza'
import type { PolizaModel } from '@gen/models/Poliza'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface ArchivoPoliza
  extends BaseEntity,
    Pick<
      ArchivoPolizaModel,
      'polizaId' | 'nombre' | 'mimeType' | 'url' | 'tamanoBytes' | 'active'
    > {}

export type PolizaBasicInfo = Pick<PolizaModel, 'id' | 'companyId' | 'clienteUserId'>

export type CreateArchivoPolizaInput = Pick<
  ArchivoPolizaModel,
  'polizaId' | 'nombre' | 'mimeType' | 'url'
> & {
  tamanoBytes?: number | null
}

export type UpdateArchivoPolizaInput = Partial<
  Pick<ArchivoPolizaModel, 'nombre' | 'mimeType' | 'url' | 'tamanoBytes'>
>
