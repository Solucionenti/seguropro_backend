export type SeveridadHito = 'VENCIDO' | 'HOY' | 'PROXIMO'

export interface HitoParaNotificar {
  id: string
  siniestroId: string
  tarea: string
  fechaLimite: Date
  severidad: SeveridadHito
  diasRestantes: number
  numeroPoliza: string | null
  clienteNombre: string
  /// assignee and owner, already deduplicated
  destinatarios: { email: string; firstName: string }[]
  /// distinguishes each threshold so a hito notifies once per milestone reached
  marca: string
}

export interface HitoAlertaProvider {
  /// open hitos with alerta = true that reached a notice threshold
  findParaNotificar(hoy: Date, diasAviso: number[]): Promise<HitoParaNotificar[]>
}
