export interface NotificacionRepository {
  /// true when created, false when it already existed; this is what makes jobs idempotent
  registrarSiEsNueva(
    tipo: 'POLIZA_POR_VENCER' | 'HITO_ALERTA',
    entidadId: string,
    marca: string,
  ): Promise<boolean>
}
