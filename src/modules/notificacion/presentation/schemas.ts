import { z } from 'zod'

// replays a specific day without touching the clock
export const jobQuery = z.object({
  hoy: z.coerce.date().optional(),
})
