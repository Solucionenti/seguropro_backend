import { z } from 'zod'

// lets an operator replay a specific day without touching the clock
export const jobQuery = z.object({
  hoy: z.coerce.date().optional(),
})
