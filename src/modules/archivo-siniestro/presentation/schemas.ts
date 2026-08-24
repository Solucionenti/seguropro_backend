import { z } from 'zod'

// must stay `:id`: elysia demands the same param name at the same position
export const siniestroScopeParams = z.object({
  id: z.string().uuid('Invalid siniestro ID format'),
})

export const archivoScopeParams = z.object({
  id: z.string().uuid('Invalid siniestro ID format'),
  archivoId: z.string().uuid('Invalid archivo ID format'),
})

export const uploadArchivoSiniestroSchema = z.object({
  file: z.instanceof(File, { message: 'file is required' }),
  nombre: z.string().min(1).max(255).optional(),
})

export const renameArchivoSiniestroSchema = z.object({
  nombre: z.string().min(1, 'nombre is required').max(255),
})
