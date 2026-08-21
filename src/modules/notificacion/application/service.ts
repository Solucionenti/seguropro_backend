import type { EmailSender } from '@/shared/domain/email-sender'
import type { NotificacionResumen } from '../domain/entities'
import type { PolizaVencimientoProvider } from '../domain/poliza-vencimiento-provider'
import type { NotificacionRepository } from '../domain/repository'
import type { INotificacionService } from '../domain/service'

interface NotificacionConfig {
  appUrl: string
}

export class NotificacionService implements INotificacionService {
  constructor(
    private readonly polizaProvider: PolizaVencimientoProvider,
    private readonly repo: NotificacionRepository,
    private readonly emailSender: EmailSender,
    private readonly config: NotificacionConfig,
  ) {}

  async notificarPolizasPorVencer(hoy: Date): Promise<NotificacionResumen> {
    const polizas = await this.polizaProvider.findPorVencer(hoy)

    const resumen: NotificacionResumen = {
      revisadas: polizas.length,
      notificadas: 0,
      omitidasPorDuplicado: 0,
      fallidas: 0,
    }

    for (const poliza of polizas) {
      // reserve the (poliza, umbral) pair first: if the send later fails the row stays
      // and the notice is not retried, which is the tradeoff the spec asks for by
      // demanding no duplicates
      const esNueva = await this.repo.registrarSiEsNueva(
        'POLIZA_POR_VENCER',
        poliza.id,
        String(poliza.umbralDias),
      )

      if (!esNueva) {
        resumen.omitidasPorDuplicado++
        continue
      }

      try {
        await this.polizaProvider.marcarProximaAVencer(poliza.id)
        await this.emailSender.sendPolizaPorVencer({
          to: poliza.ownerEmail,
          firstName: poliza.ownerFirstName,
          numeroPoliza: poliza.numeroPoliza,
          clienteNombre: poliza.clienteNombre,
          aseguradoraNombre: poliza.aseguradoraNombre,
          fechaVencimiento: poliza.fechaVencimiento,
          diasRestantes: poliza.diasRestantes,
          detalleUrl: `${this.config.appUrl}/polizas/${poliza.id}`,
        })
        resumen.notificadas++
      } catch (error) {
        // one bad address must not stop the whole run
        console.error(`Failed to notify poliza ${poliza.id}:`, error)
        resumen.fallidas++
      }
    }

    return resumen
  }
}
