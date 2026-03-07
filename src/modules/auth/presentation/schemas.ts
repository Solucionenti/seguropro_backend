import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  companyId: z.string().uuid('Invalid company ID').optional(),
})

export const identifySchema = z.object({
  email: z.string().email('Invalid email format'),
})
