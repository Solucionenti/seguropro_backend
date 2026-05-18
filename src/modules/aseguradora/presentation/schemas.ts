import { z } from 'zod'
import { listQuery } from '@/shared/utils/pagination'

export const createAseguradoraSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(200),
  descripcion: z.string().max(1000).optional(),
})

export const updateAseguradoraSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(1000).nullable().optional(),
})

export const aseguradoraListQuery = listQuery({
  nombre: z.string().optional(),
})
