import { PolizaStatus } from '@gen/enums'
import { z } from 'zod'
import { listQuery } from '@/shared/utils/pagination'

export const createPolizaSchema = z.object({
  aseguradoraId: z.string().uuid('Invalid aseguradoraId'),
  ramoId: z.string().uuid('Invalid ramoId'),
  clienteUserId: z.string().uuid('Invalid clienteUserId'),
  numeroPoliza: z.string().min(1, 'numeroPoliza is required').max(100),
  fechaInicio: z.coerce.date(),
  fechaVencimiento: z.coerce.date(),
  primaNeta: z.number().nonnegative(),
  primaTotal: z.number().nonnegative(),
  polizaStatus: z.nativeEnum(PolizaStatus).optional(),
})

export const updatePolizaSchema = z
  .object({
    primaNeta: z.number().nonnegative().optional(),
    primaTotal: z.number().nonnegative().optional(),
    fechaVencimiento: z.coerce.date().optional(),
    polizaStatus: z.nativeEnum(PolizaStatus).optional(),
  })
  .refine(
    (data) =>
      data.primaNeta !== undefined ||
      data.primaTotal !== undefined ||
      data.fechaVencimiento !== undefined ||
      data.polizaStatus !== undefined,
    { message: 'At least one field must be provided' },
  )

export const polizaListQuery = listQuery({
  numeroPoliza: z.string().optional(),
  aseguradoraId: z.string().uuid().optional(),
  ramoId: z.string().uuid().optional(),
  polizaStatus: z.nativeEnum(PolizaStatus).optional(),
})
