export interface NotificacionRepository {
  /**
   * true when the row was created, false when it already existed. the unique on
   * (tipo, entidadId, marca) is what makes the job idempotent, so a scheduler retry
   * never resends the same notice
   */
  registrarSiEsNueva(tipo: 'POLIZA_POR_VENCER', entidadId: string, marca: string): Promise<boolean>
}
