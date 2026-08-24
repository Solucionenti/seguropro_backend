import { HitoStatus } from '@gen/enums'
import { z } from 'zod'
import { listQuery } from '@/shared/utils/pagination'

// must stay `:id`: elysia demands the same param name at the same position
export const siniestroScopeParams = z.object({
  id: z.string().uuid('Invalid siniestro ID format'),
})

export const hitoScopeParams = z.object({
  id: z.string().uuid('Invalid siniestro ID format'),
  hitoId: z.string().uuid('Invalid hito ID format'),
})

export const createHitoSchema = z.object({
  tarea: z.string().min(1, 'tarea is required').max(300),
  fechaLimite: z.coerce.date(),
  descripcion: z.string().max(2000).optional(),
  alerta: z.boolean().optional(),
  hitoStatus: z.nativeEnum(HitoStatus).optional(),
  asignadoAUserId: z.string().uuid().optional(),
})

export const updateHitoSchema = z
  .object({
    tarea: z.string().min(1).max(300).optional(),
    descripcion: z.string().max(2000).optional(),
    fechaLimite: z.coerce.date().optional(),
    alerta: z.boolean().optional(),
    hitoStatus: z.nativeEnum(HitoStatus).optional(),
    asignadoAUserId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  })

export const hitoListQuery = listQuery({
  hitoStatus: z.nativeEnum(HitoStatus).optional(),
  asignadoAUserId: z.string().uuid().optional(),
})

export const alertaListQuery = listQuery({
  diasHorizonte: z.coerce.number().int().min(0).max(365).default(7),
  severidad: z.enum(['VENCIDO', 'HOY', 'PROXIMO']).optional(),
  asignadoAUserId: z.string().uuid().optional(),
  siniestroId: z.string().uuid().optional(),
})
