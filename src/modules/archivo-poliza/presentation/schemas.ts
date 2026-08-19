import { z } from 'zod'

// the poliza segment must stay `:id`: elysia requires the same param name at the
// same position and polizaController already registers /polizas/:id
export const polizaScopeParams = z.object({
  id: z.string().uuid('Invalid poliza ID format'),
})

export const archivoScopeParams = z.object({
  id: z.string().uuid('Invalid poliza ID format'),
  archivoId: z.string().uuid('Invalid archivo ID format'),
})

export const createArchivoPolizaSchema = z.object({
  nombre: z.string().min(1, 'nombre is required').max(255),
  mimeType: z.string().min(1, 'mimeType is required').max(120),
  url: z.string().url('url must be a valid URL'),
  tamanoBytes: z.number().int().nonnegative().optional(),
})

export const updateArchivoPolizaSchema = z
  .object({
    nombre: z.string().min(1).max(255).optional(),
    mimeType: z.string().min(1).max(120).optional(),
    url: z.string().url('url must be a valid URL').optional(),
    tamanoBytes: z.number().int().nonnegative().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  })
