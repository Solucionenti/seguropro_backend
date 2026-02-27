export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
  uptime: number
  database: 'connected' | 'disconnected'
}
