import { TipoPersona } from '@gen/enums'
import { z } from 'zod'
import { listQuery } from '@/shared/utils/pagination'

export const companyListQuery = listQuery({
  nombre: z.string().optional(),
  rfc: z.string().optional(),
  tipoPersona: z.nativeEnum(TipoPersona).optional(),
})
