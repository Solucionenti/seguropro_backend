import { z } from 'zod'
import { paginationQuery } from '@/shared/utils/pagination'

export const suscripcionStatusEnum = z.enum([
  'TRIAL',
  'ACTIVA',
  'CANCELADA',
  'VENCIDA',
  'SUSPENDIDA',
])

export const listSuscripcionQuerySchema = paginationQuery.extend({
  companyId: z.string().uuid().optional(),
  suscripcionStatus: suscripcionStatusEnum.optional(),
  active: z.coerce.boolean().optional(),
})

export const createSuscripcionSchema = z.object({
  companyId: z.string().uuid(),
  planId: z.string().uuid(),
  suscripcionStatus: suscripcionStatusEnum.default('TRIAL'),
  active: z.boolean().default(true),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date().optional(),
  fechaProximoPago: z.coerce.date(),
  renovacionAutomatica: z.boolean().default(true),
})

export const createOwnerSuscripcionSchema = z.object({
  planId: z.string().uuid(),
  suscripcionStatus: z.enum(['TRIAL', 'ACTIVA', 'CANCELADA']).default('ACTIVA'),
  renovacionAutomatica: z.boolean().default(true),
})

export const updateSuscripcionSchema = z.object({
  suscripcionStatus: suscripcionStatusEnum.optional(),
  active: z.boolean().optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFin: z.coerce.date().optional(),
  fechaProximoPago: z.coerce.date().optional(),
  renovacionAutomatica: z.boolean().optional(),
})
