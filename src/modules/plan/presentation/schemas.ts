import { z } from 'zod'
import { listQuery } from '@/shared/utils/pagination'

export const periodicidadEnum = z.enum(['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'])

export const listPlanQuerySchema = listQuery({
  active: z.coerce.boolean().optional(),
})

export const createPlanSchema = z.object({
  nombre: z.string().min(1).max(200),
  descripcion: z.string().max(1000).optional(),
  precio: z.number().positive(),
  periodicidad: periodicidadEnum,
  limiteUsuarios: z.number().int().positive(),
  limiteAlmacenamientoGB: z.number().positive().optional(),
  features: z.array(z.string()).optional(),
  active: z.coerce.boolean().optional(),
})

export const updatePlanSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(1000).optional(),
  precio: z.number().positive().optional(),
  periodicidad: periodicidadEnum.optional(),
  limiteUsuarios: z.number().int().positive().optional(),
  limiteAlmacenamientoGB: z.number().positive().optional(),
  features: z.array(z.string()).optional(),
  active: z.coerce.boolean().optional(),
})
