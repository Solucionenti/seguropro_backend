import { render } from '@react-email/render'
import { AppError } from '@/shared/domain/app-error'
import type {
  EmailSender,
  HitoAlertaEmailInput,
  PasswordResetEmailInput,
  PolizaPorVencerEmailInput,
} from '@/shared/domain/email-sender'
import { HitoAlertaEmail } from './emails/hito-alerta-email'
import { PasswordResetEmail } from './emails/password-reset-email'
import { PolizaPorVencerEmail } from './emails/poliza-por-vencer-email'

interface ResendConfig {
  apiKey: string
  from: string
}

export class ResendEmailSender implements EmailSender {
  constructor(private readonly config: ResendConfig) {}

  async sendPasswordReset({ to, ...props }: PasswordResetEmailInput): Promise<void> {
    const html = await render(PasswordResetEmail(props))
    await this.send(to, 'Restablece tu contraseña', html)
  }

  async sendPolizaPorVencer({ to, ...props }: PolizaPorVencerEmailInput): Promise<void> {
    const html = await render(PolizaPorVencerEmail(props))
    await this.send(to, `La poliza ${props.numeroPoliza} esta por vencer`, html)
  }

  async sendHitoAlerta({ to, ...props }: HitoAlertaEmailInput): Promise<void> {
    const html = await render(HitoAlertaEmail(props))
    const asunto =
      props.severidad === 'VENCIDO'
        ? `Hito vencido: ${props.tarea}`
        : `Hito por vencer: ${props.tarea}`
    await this.send(to, asunto, html)
  }

  // sent synchronously inside the request, move to a queue if latency becomes a problem
  private async send(to: string, subject: string, html: string): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.config.from, to, subject, html }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('Resend send failed:', response.status, detail)
      throw new AppError('Failed to send email', 502, 'EMAIL_SEND_FAILED')
    }
  }
}
