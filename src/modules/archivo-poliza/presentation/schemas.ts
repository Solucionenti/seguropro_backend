import { z } from 'zod'

// El segmento de la póliza se llama `:id` porque el router de Elysia exige el mismo
// nombre de parámetro en la misma posición, y `polizaController` ya registra
// `/polizas/:id`. El id del archivo va como `:archivoId`.
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
