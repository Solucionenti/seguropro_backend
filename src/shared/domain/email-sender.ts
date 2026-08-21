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

export interface EmailSender {
  sendPasswordReset(input: PasswordResetEmailInput): Promise<void>
  sendPolizaPorVencer(input: PolizaPorVencerEmailInput): Promise<void>
}
