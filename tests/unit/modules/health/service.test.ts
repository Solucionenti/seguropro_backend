import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { HealthService } from '@/modules/health/application/service'
import type { HealthRepository } from '@/modules/health/domain/repository'
import type { Mocked } from '../../../utils/mocked'

function createMocks() {
  const healthRepo: Mocked<HealthRepository> = {
    checkDatabaseConnection: mock(() => Promise.resolve(true)),
  }
  return { healthRepo }
}

describe('HealthService', () => {
  let healthService: HealthService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    healthService = new HealthService(mocks.healthRepo)
  })

  it('should return ok status when database is connected', async () => {
    const status = await healthService.getStatus()

    expect(status.status).toBe('ok')
    expect(status.database).toBe('connected')
    expect(status.timestamp).toBeString()
    expect(status.uptime).toBeNumber()
  })

  it('should return degraded status when database is disconnected', async () => {
    mocks.healthRepo.checkDatabaseConnection.mockResolvedValue(false)

    const status = await healthService.getStatus()

    expect(status.status).toBe('degraded')
    expect(status.database).toBe('disconnected')
  })
})
