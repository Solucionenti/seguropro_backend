import type { EmailSender } from '@/shared/domain/email-sender'
import type { NotificacionResumen } from '../domain/entities'
import type { HitoAlertaProvider } from '../domain/hito-alerta-provider'
import type { PolizaVencimientoProvider } from '../domain/poliza-vencimiento-provider'
import type { NotificacionRepository } from '../domain/repository'
import type { INotificacionService } from '../domain/service'

interface NotificacionConfig {
  appUrl: string
  /// days of notice for upcoming hitos
  hitoAvisoDias: number[]
}

export class NotificacionService implements INotificacionService {
  constructor(
    private readonly polizaProvider: PolizaVencimientoProvider,
    private readonly hitoProvider: HitoAlertaProvider,
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
      // reserved before sending: a failed send is not retried, never double-sent
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

  async notificarHitos(hoy: Date): Promise<NotificacionResumen> {
    const hitos = await this.hitoProvider.findParaNotificar(hoy, this.config.hitoAvisoDias)

    const resumen: NotificacionResumen = {
      revisadas: hitos.length,
      notificadas: 0,
      omitidasPorDuplicado: 0,
      fallidas: 0,
    }

    for (const hito of hitos) {
      // reserved before sending, same tradeoff as the poliza job
      const esNueva = await this.repo.registrarSiEsNueva('HITO_ALERTA', hito.id, hito.marca)

      if (!esNueva) {
        resumen.omitidasPorDuplicado++
        continue
      }

      try {
        await Promise.all(
          hito.destinatarios.map((destinatario) =>
            this.emailSender.sendHitoAlerta({
              to: destinatario.email,
              firstName: destinatario.firstName,
              tarea: hito.tarea,
              fechaLimite: hito.fechaLimite,
              severidad: hito.severidad,
              diasRestantes: hito.diasRestantes,
              numeroPoliza: hito.numeroPoliza,
              clienteNombre: hito.clienteNombre,
              detalleUrl: `${this.config.appUrl}/siniestros/${hito.siniestroId}`,
            }),
          ),
        )
        resumen.notificadas++
      } catch (error) {
        console.error(`Failed to notify hito ${hito.id}:`, error)
        resumen.fallidas++
      }
    }

    return resumen
  }
}
