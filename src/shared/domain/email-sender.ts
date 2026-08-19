export interface PasswordResetEmailInput {
  to: string
  firstName: string
  companyName: string | null
  resetUrl: string
  expiresIn: string
}

export interface EmailSender {
  sendPasswordReset(input: PasswordResetEmailInput): Promise<void>
}
