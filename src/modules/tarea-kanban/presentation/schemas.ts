import { z } from 'zod'
import { listQuery } from '@/shared/utils/pagination'

export const createTareaKanbanSchema = z.object({
  columnaKanbanId: z.string().uuid('Invalid columnaKanbanId').nullable().optional(),
  polizaId: z.string().uuid('Invalid polizaId').nullable().optional(),
  titulo: z.string().trim().min(1, 'Titulo is required').max(200),
  descripcion: z.string().max(2000).nullable().optional(),
})

export const updateTareaKanbanSchema = z
  .object({
    columnaKanbanId: z.string().uuid('Invalid columnaKanbanId').nullable().optional(),
    polizaId: z.string().uuid('Invalid polizaId').nullable().optional(),
    titulo: z.string().trim().min(1).max(200).optional(),
    descripcion: z.string().max(2000).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export const tareaKanbanListQuery = listQuery({
  columnaKanbanId: z.string().uuid().optional(),
  polizaId: z.string().uuid().optional(),
  titulo: z.string().optional(),
})
