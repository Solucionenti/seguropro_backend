import { describe, expect, it } from 'bun:test'
import { app } from '@/app'

// Regresión: si el hook `onError` del errorHandler deja de ser `as: 'global'`,
// Elysia responde el error crudo en texto plano con status 500 y estos fallan.
describe('AppError responses', () => {
  it('should return 401 with the ApiResponse shape when the Bearer token is missing', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/users/me'))
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.message).toBeString()
  })

  it('should return 401 with the ApiResponse shape for an invalid reset token', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'not-a-jwt', password: 'newPassword123' }),
      }),
    )
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(401)
    expect(body.success).toBe(false)
  })
})
