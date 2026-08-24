import type { NotificacionResumen } from './entities'

export interface INotificacionService {
  notificarPolizasPorVencer(hoy: Date): Promise<NotificacionResumen>
  notificarHitos(hoy: Date): Promise<NotificacionResumen>
}
