import { render } from '@react-email/render'
import { AppError } from '@/shared/domain/app-error'
import type { EmailSender, PasswordResetEmailInput } from '@/shared/domain/email-sender'
import { PasswordResetEmail } from './emails/password-reset-email'

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

  // ponytail: fetch directo, el SDK `resend` es un wrapper de esto.
  // Envío síncrono dentro del request: mover a cola si el latency del request importa.
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
