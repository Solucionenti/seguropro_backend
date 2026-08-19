import { TipoPersona } from '@gen/enums'
import { z } from 'zod'
import { listQuery } from '@/shared/utils/pagination'

export const companyListQuery = listQuery({
  nombre: z.string().optional(),
  rfc: z.string().optional(),
  tipoPersona: z.nativeEnum(TipoPersona).optional(),
})

// put semantics: emailContacto and telefonoContacto are the non-nullable columns,
// every other field is replaced with null when omitted
export const updateMyCompanySchema = z.object({
  emailContacto: z.string().email('Invalid emailContacto'),
  telefonoContacto: z.string().min(1, 'telefonoContacto is required').max(20),
  razonSocial: z.string().max(200).nullish(),
  nombreComercial: z.string().max(200).nullish(),
  rfc: z.string().max(20).nullish(),
  tipoPersona: z.nativeEnum(TipoPersona).nullish(),
  pais: z.string().max(100).nullish(),
  estado: z.string().max(100).nullish(),
})
