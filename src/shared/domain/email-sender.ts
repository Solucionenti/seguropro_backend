export interface PasswordResetEmailInput {
  to: string
  firstName: string
  companyName: string | null
  resetUrl: string
  expiresIn: string
}

export interface PolizaPorVencerEmailInput {
  to: string
  firstName: string
  numeroPoliza: string
  clienteNombre: string
  aseguradoraNombre: string
  fechaVencimiento: Date
  diasRestantes: number
  detalleUrl: string
}

export interface HitoAlertaEmailInput {
  to: string
  firstName: string
  tarea: string
  fechaLimite: Date
  severidad: 'VENCIDO' | 'HOY' | 'PROXIMO'
  diasRestantes: number
  numeroPoliza: string | null
  clienteNombre: string
  detalleUrl: string
}

export interface EmailSender {
  sendPasswordReset(input: PasswordResetEmailInput): Promise<void>
  sendPolizaPorVencer(input: PolizaPorVencerEmailInput): Promise<void>
  sendHitoAlerta(input: HitoAlertaEmailInput): Promise<void>
}
