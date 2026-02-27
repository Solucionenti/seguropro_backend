import { describe, expect, it } from 'bun:test'
import { app } from '@/app'

describe('GET /api/v1/health', () => {
  it('should return a successful health response with standard shape', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/health'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(body.data.status).toBeOneOf(['ok', 'degraded'])
    expect(body.data.timestamp).toBeString()
    expect(body.data.uptime).toBeNumber()
    expect(body.data.database).toBeOneOf(['connected', 'disconnected'])
  })

  it('should return 404 for unknown routes', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/nonexistent'))

    expect(response.status).toBe(404)
  })
})
