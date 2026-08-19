import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface PasswordResetEmailProps {
  firstName: string
  companyName: string | null
  resetUrl: string
  expiresIn: string
}

export function PasswordResetEmail({
  firstName,
  companyName,
  resetUrl,
  expiresIn,
}: PasswordResetEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>Restablece tu contraseña de Segur</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={heading}>Restablece tu contraseña</Text>

          <Text style={paragraph}>Hola {firstName},</Text>

          <Text style={paragraph}>
            Recibimos una solicitud para restablecer la contraseña de tu cuenta
            {companyName ? ` en ${companyName}` : ''}. Haz clic en el botón para elegir una nueva.
          </Text>

          <Section style={buttonSection}>
            <Button href={resetUrl} style={button}>
              Restablecer contraseña
            </Button>
          </Section>

          <Text style={paragraph}>
            El enlace expira en {expiresIn}. Si no solicitaste este cambio, ignora este correo: tu
            contraseña actual seguirá siendo válida.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            ¿El botón no funciona? Copia y pega este enlace en tu navegador:
            <br />
            {resetUrl}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: '#f4f4f5',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e4e4e7',
  borderRadius: '8px',
  margin: '40px auto',
  maxWidth: '480px',
  padding: '32px',
}

const heading = {
  color: '#18181b',
  fontSize: '22px',
  fontWeight: 600,
  margin: '0 0 24px',
}

const paragraph = {
  color: '#3f3f46',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const buttonSection = {
  margin: '28px 0',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#18181b',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 600,
  padding: '12px 24px',
  textDecoration: 'none',
}

const hr = {
  borderColor: '#e4e4e7',
  margin: '28px 0 16px',
}

const footer = {
  color: '#71717a',
  fontSize: '12px',
  lineHeight: '20px',
  margin: 0,
  wordBreak: 'break-all' as const,
}
