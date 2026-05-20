import { z } from 'zod'

const detalleClienteSchema = z.object({
  fechaNacimiento: z.coerce.date().nullable().optional(),
  rfc: z.string().max(20).nullable().optional(),
  curp: z.string().max(20).nullable().optional(),
  direccion: z.string().max(200).nullable().optional(),
  ciudad: z.string().max(100).nullable().optional(),
  estado: z.string().max(100).nullable().optional(),
  codigoPostal: z.string().max(10).nullable().optional(),
  notas: z.string().nullable().optional(),
})

export const createAgentSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(1).max(20),
  password: z.string().min(8),
})

export const createClientSchema = createAgentSchema.extend({
  detalle: detalleClienteSchema.optional(),
})

export const updateCompanyUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(20).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  detalle: detalleClienteSchema.optional(),
})
