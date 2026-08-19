import { z } from 'zod'
import { listQuery } from '@/shared/utils/pagination'

export const createColumnaKanbanSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(200),
  prioridad: z.number().int().min(1, 'Prioridad must be a positive integer'),
})

export const updateColumnaKanbanSchema = z
  .object({
    nombre: z.string().min(1).max(200).optional(),
    prioridad: z.number().int().min(1).optional(),
  })
  .refine((data) => data.nombre !== undefined || data.prioridad !== undefined, {
    message: 'At least one field must be provided',
  })

export const columnaKanbanListQuery = listQuery({
  nombre: z.string().optional(),
})
