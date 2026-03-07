import type { HealthStatus } from '../domain/entities'
import type { IHealthService } from '../domain/health-service'
import type { HealthRepository } from '../domain/repository'

export class HealthService implements IHealthService {
  constructor(private readonly repo: HealthRepository) {}

  async getStatus(): Promise<HealthStatus> {
    const dbConnected = await this.repo.checkDatabaseConnection()

    return {
      status: dbConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbConnected ? 'connected' : 'disconnected',
    }
  }
}
