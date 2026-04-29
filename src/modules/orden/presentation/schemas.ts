import { z } from 'zod'
import { paginationQuery } from '@/shared/utils/pagination'

export const ordenStatusEnum = z.enum(['PENDIENTE', 'PAGADA', 'FALLIDA', 'CANCELADA'])

export const listOrdenQuerySchema = paginationQuery.extend({
  companyId: z.string().uuid().optional(),
  ordenStatus: ordenStatusEnum.optional(),
  cicloInicio: z.coerce.date().optional(),
  cicloFin: z.coerce.date().optional(),
})

export const createOrdenSchema = z.object({
  suscripcionId: z.string().uuid(),
  cicloInicio: z.coerce.date(),
  cicloFin: z.coerce.date(),
  monto: z.number().positive(),
  moneda: z.string().min(1).max(10).default('MXN'),
  ordenStatus: ordenStatusEnum.default('PENDIENTE'),
  proveedor: z.string().optional(),
  proveedorOrdenId: z.string().optional(),
  proveedorPagoId: z.string().optional(),
})

export const listOwnerOrdenQuerySchema = paginationQuery.extend({
  ordenStatus: ordenStatusEnum.optional(),
  cicloInicio: z.coerce.date().optional(),
  cicloFin: z.coerce.date().optional(),
})

export const createOwnerOrdenSchema = z.object({
  cicloInicio: z.coerce.date(),
  cicloFin: z.coerce.date(),
  moneda: z.string().min(1).max(10).default('MXN'),
})

export const payOrdenSchema = z.object({
  proveedor: z.string().optional(),
  proveedorOrdenId: z.string().optional(),
  proveedorPagoId: z.string().optional(),
  pagadaEn: z.coerce.date().optional(),
})

export const updateOrdenSchema = z.object({
  ordenStatus: ordenStatusEnum.optional(),
  proveedor: z.string().optional(),
  proveedorOrdenId: z.string().optional(),
  proveedorPagoId: z.string().optional(),
  pagadaEn: z.coerce.date().optional(),
  motivoFallo: z.string().optional(),
})
