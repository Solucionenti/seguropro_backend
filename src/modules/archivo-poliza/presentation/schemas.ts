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

export const uploadArchivoPolizaSchema = z.object({
  file: z.instanceof(File, { message: 'file is required' }),
  nombre: z.string().min(1).max(255).optional(),
})

export const renameArchivoPolizaSchema = z.object({
  nombre: z.string().min(1, 'nombre is required').max(255),
})

export const signedFileQuery = z.object({
  expires: z.coerce.number().int(),
  signature: z.string().min(1),
})
