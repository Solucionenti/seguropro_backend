export interface PolizaPorVencer {
  id: string
  companyId: string
  numeroPoliza: string
  fechaVencimiento: Date
  aseguradoraNombre: string
  clienteNombre: string
  ownerEmail: string
  ownerFirstName: string
  /// dias configurados por la empresa que este vencimiento alcanza
  umbralDias: number
  diasRestantes: number
}

export interface NotificacionResumen {
  revisadas: number
  notificadas: number
  omitidasPorDuplicado: number
  fallidas: number
}
