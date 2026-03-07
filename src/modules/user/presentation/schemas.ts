import { z } from 'zod'

// ── Admin schemas ────────────────────────────────────────

export const createAdminSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone is required').max(20),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const updateAdminSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(20).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

// ── Owner schemas ────────────────────────────────────────

export const createOwnerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone is required').max(20),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  company: z.object({
    nombreComercial: z.string().min(1, 'Company name is required').max(200),
    razonSocial: z.string().max(200).optional(),
    emailContacto: z.string().email('Invalid company email format'),
    telefonoContacto: z.string().min(1, 'Company phone is required').max(20),
  }),
})

export const updateOwnerSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(20).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

// ── Profile schemas ──────────────────────────────────────

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(20).optional(),
})
