import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'

export interface PolizaPorVencerEmailProps {
  firstName: string
  numeroPoliza: string
  clienteNombre: string
  aseguradoraNombre: string
  fechaVencimiento: Date
  diasRestantes: number
  detalleUrl: string
}

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function PolizaPorVencerEmail({
  firstName,
  numeroPoliza,
  clienteNombre,
  aseguradoraNombre,
  fechaVencimiento,
  diasRestantes,
  detalleUrl,
}: PolizaPorVencerEmailProps) {
  const plazo = diasRestantes === 1 ? 'mañana' : `en ${diasRestantes} días`

  return (
    <Html lang="es">
      <Head />
      <Preview>{`La póliza ${numeroPoliza} vence ${plazo}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={heading}>Una póliza está por vencer</Text>

          <Text style={paragraph}>Hola {firstName},</Text>

          <Text style={paragraph}>
            La póliza <strong>{numeroPoliza}</strong> vence {plazo}. Te dejamos los datos para que
            puedas dar seguimiento a la renovación.
          </Text>

          <Section style={datos}>
            <Row>
              <Text style={dato}>
                <span style={etiqueta}>Cliente</span>
                <br />
                {clienteNombre}
              </Text>
            </Row>
            <Row>
              <Text style={dato}>
                <span style={etiqueta}>Aseguradora</span>
                <br />
                {aseguradoraNombre}
              </Text>
            </Row>
            <Row>
              <Text style={dato}>
                <span style={etiqueta}>Vence</span>
                <br />
                {formatoFecha.format(fechaVencimiento)}
              </Text>
            </Row>
          </Section>

          <Section style={buttonSection}>
            <Button href={detalleUrl} style={button}>
              Ver la póliza
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            ¿El botón no funciona? Copia y pega este enlace en tu navegador:
            <br />
            {detalleUrl}
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

const datos = {
  backgroundColor: '#fafafa',
  border: '1px solid #e4e4e7',
  borderRadius: '6px',
  margin: '24px 0',
  padding: '8px 16px',
}

const dato = {
  color: '#18181b',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '12px 0',
}

const etiqueta = {
  color: '#71717a',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
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
