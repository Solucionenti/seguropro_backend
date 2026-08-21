import type { PolizaPorVencer } from './entities'

export interface PolizaVencimientoProvider {
  /**
   * polizas VIGENTE o PROXIMA_A_VENCER cuyo vencimiento cae exactamente en uno de los
   * umbrales que configuro su propia empresa, con la company y el OWNER ya resueltos
   */
  findPorVencer(hoy: Date): Promise<PolizaPorVencer[]>
  marcarProximaAVencer(polizaId: string): Promise<void>
}
