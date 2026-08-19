import type { AseguradoraModel } from '@gen/models/Aseguradora'
import type { ColumnaKanbanModel } from '@gen/models/ColumnaKanban'
import type { PolizaModel } from '@gen/models/Poliza'
import type { RamoModel } from '@gen/models/Ramo'
import type { UserModel } from '@gen/models/User'
import type { BaseEntity } from '@/shared/domain/base-entity'

export interface Poliza
  extends BaseEntity,
    Pick<
      PolizaModel,
      | 'companyId'
      | 'aseguradoraId'
      | 'ramoId'
      | 'clienteUserId'
      | 'numeroPoliza'
      | 'fechaInicio'
      | 'fechaVencimiento'
      | 'primaNeta'
      | 'primaTotal'
      | 'polizaStatus'
      | 'active'
    > {}

export type AseguradoraBasicInfo = Pick<AseguradoraModel, 'id' | 'companyId' | 'nombre'>
export type ColumnaKanbanBasicInfo = Pick<
  ColumnaKanbanModel,
  'id' | 'companyId' | 'nombre' | 'prioridad'
>
export type RamoBasicInfo = Pick<RamoModel, 'id' | 'companyId' | 'nombre'>
export type ClienteBasicInfo = Pick<
  UserModel,
  'id' | 'companyId' | 'firstName' | 'lastName' | 'email'
>

export interface PolizaWithDetails extends Poliza {
  aseguradora: AseguradoraBasicInfo
  kanban: ColumnaKanbanBasicInfo | null
  ramo: RamoBasicInfo
  cliente: ClienteBasicInfo
}

export type CreatePolizaInput = Pick<
  PolizaModel,
  | 'companyId'
  | 'aseguradoraId'
  | 'ramoId'
  | 'clienteUserId'
  | 'numeroPoliza'
  | 'fechaInicio'
  | 'fechaVencimiento'
  | 'primaNeta'
  | 'primaTotal'
> & {
  polizaStatus?: PolizaModel['polizaStatus']
}

export type UpdatePolizaInput = Partial<
  Pick<PolizaModel, 'primaNeta' | 'primaTotal' | 'fechaVencimiento' | 'polizaStatus'>
>

export type UpdatePolizaKanbanInput = Pick<PolizaModel, 'kanbanId'>
