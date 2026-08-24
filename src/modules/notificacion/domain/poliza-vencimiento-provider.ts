import type { PolizaPorVencer } from './entities'

export interface PolizaVencimientoProvider {
  /// polizas whose expiry lands exactly on one of their own company thresholds
  findPorVencer(hoy: Date): Promise<PolizaPorVencer[]>
  marcarProximaAVencer(polizaId: string): Promise<void>
}
