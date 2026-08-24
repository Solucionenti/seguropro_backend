import type { HitoStatus } from '@gen/enums'
import type { Page, Pageable } from '@/shared/domain/pagination'
import type { HitoSiniestro } from './entities'

/// derived from fechaLimite against today, never stored
export type Severidad = 'VENCIDO' | 'HOY' | 'PROXIMO'

export interface HitoAlerta extends HitoSiniestro {
  severidad: Severidad
  diasRestantes: number
  asignadoANombre: string | null
  siniestroId: string
  numeroPoliza: string | null
  clienteNombre: string
}

export interface AlertaFilters {
  companyId: string
  hasta: Date
  severidad?: Severidad
  asignadoAUserId?: string
  siniestroId?: string
}

export const ESTADOS_ABIERTOS: HitoStatus[] = ['PENDIENTE', 'EN_PROCESO']

export interface AlertaRepository {
  findAlertas(pageable: Pageable, filters: AlertaFilters): Promise<Page<HitoAlerta>>
}
