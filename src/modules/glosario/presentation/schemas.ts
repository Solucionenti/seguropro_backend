import { z } from 'zod'
import { listQuery } from '@/shared/utils/pagination'

export const createGlosarioSchema = z.object({
  titulo: z.string().min(1, 'titulo is required').max(200),
  descripcion: z.string().min(1, 'descripcion is required').max(5000),
})

export const updateGlosarioSchema = z
  .object({
    titulo: z.string().min(1).max(200).optional(),
    descripcion: z.string().min(1).max(5000).optional(),
  })
  .refine((data) => data.titulo !== undefined || data.descripcion !== undefined, {
    message: 'At least one field must be provided',
  })

export const glosarioListQuery = listQuery({
  titulo: z.string().optional(),
})
