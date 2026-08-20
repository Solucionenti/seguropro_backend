import { SiniestroStatus } from '@gen/enums'
import { z } from 'zod'
import { listQuery } from '@/shared/utils/pagination'

export const createSiniestroSchema = z.object({
  polizaId: z.string().uuid('Invalid polizaId'),
  fechaEvento: z.coerce.date(),
  tipoSiniestro: z.string().min(1).max(120).optional(),
  descripcion: z.string().max(2000).optional(),
  ajustador: z.string().min(1).max(160).optional(),
  montoEstimado: z.number().nonnegative().optional(),
  siniestroStatus: z.nativeEnum(SiniestroStatus).optional(),
})

export const updateSiniestroSchema = z
  .object({
    tipoSiniestro: z.string().min(1).max(120).optional(),
    descripcion: z.string().max(2000).optional(),
    ajustador: z.string().min(1).max(160).optional(),
    montoEstimado: z.number().nonnegative().optional(),
    montoPagado: z.number().nonnegative().optional(),
    siniestroStatus: z.nativeEnum(SiniestroStatus).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  })

export const siniestroListQuery = listQuery({
  polizaId: z.string().uuid().optional(),
  siniestroStatus: z.nativeEnum(SiniestroStatus).optional(),
  tipoSiniestro: z.string().optional(),
})
