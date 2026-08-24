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

export interface HitoAlertaEmailProps {
  firstName: string
  tarea: string
  fechaLimite: Date
  severidad: 'VENCIDO' | 'HOY' | 'PROXIMO'
  diasRestantes: number
  numeroPoliza: string | null
  clienteNombre: string
  detalleUrl: string
}

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

function encabezadoPara(severidad: HitoAlertaEmailProps['severidad']): string {
  if (severidad === 'VENCIDO') return 'Un hito venció'
  if (severidad === 'HOY') return 'Un hito vence hoy'
  return 'Un hito está por vencer'
}

function plazoPara(severidad: HitoAlertaEmailProps['severidad'], dias: number): string {
  if (severidad === 'VENCIDO') {
    const atraso = Math.abs(dias)
    return atraso === 1 ? 'venció ayer' : `venció hace ${atraso} días`
  }
  if (severidad === 'HOY') return 'vence hoy'
  return dias === 1 ? 'vence mañana' : `vence en ${dias} días`
}

export function HitoAlertaEmail({
  firstName,
  tarea,
  fechaLimite,
  severidad,
  diasRestantes,
  numeroPoliza,
  clienteNombre,
  detalleUrl,
}: HitoAlertaEmailProps) {
  const encabezado = encabezadoPara(severidad)
  const plazo = plazoPara(severidad, diasRestantes)

  return (
    <Html lang="es">
      <Head />
      <Preview>{`${tarea} ${plazo}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={heading}>{encabezado}</Text>

          <Text style={paragraph}>Hola {firstName},</Text>

          <Text style={paragraph}>
            El hito <strong>{tarea}</strong> {plazo}.
          </Text>

          <Section style={datos}>
            <Row>
              <Text style={dato}>
                <span style={etiqueta}>Fecha límite</span>
                <br />
                {formatoFecha.format(fechaLimite)}
              </Text>
            </Row>
            <Row>
              <Text style={dato}>
                <span style={etiqueta}>Cliente</span>
                <br />
                {clienteNombre}
              </Text>
            </Row>
            {numeroPoliza ? (
              <Row>
                <Text style={dato}>
                  <span style={etiqueta}>Póliza</span>
                  <br />
                  {numeroPoliza}
                </Text>
              </Row>
            ) : null}
          </Section>

          <Section style={buttonSection}>
            <Button href={detalleUrl} style={button}>
              Ver el siniestro
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
