export interface PolizaPorVencer {
  id: string
  companyId: string
  numeroPoliza: string
  fechaVencimiento: Date
  aseguradoraNombre: string
  clienteNombre: string
  ownerEmail: string
  ownerFirstName: string
  /// the company-configured day this expiry landed on
  umbralDias: number
  diasRestantes: number
}

export interface NotificacionResumen {
  revisadas: number
  notificadas: number
  omitidasPorDuplicado: number
  fallidas: number
}
