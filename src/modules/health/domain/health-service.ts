import type { HealthStatus } from './entities'

export interface IHealthService {
  getStatus(): Promise<HealthStatus>
}
