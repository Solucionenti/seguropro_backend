import { Elysia } from 'elysia'
import { envConfig } from '@/config/env'
import { notificacionServicePlugin } from '@/config/services'
import { UnauthorizedError } from '@/shared/domain/unauthorized-error'
import { publicRouter } from '@/shared/routers/public-router'
import { jobQuery } from './schemas'

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

// called by an external scheduler; the x-job-secret header IS the authorization
export const jobController = new Elysia({
  name: '@app/modules/notificacion/jobs',
  prefix: '/jobs',
})
  .use(publicRouter)
  .use(notificacionServicePlugin)

  .onBeforeHandle(({ headers }) => {
    const enviado = headers['x-job-secret']
    if (!enviado || !timingSafeEqual(enviado, envConfig.JOB_SECRET)) {
      throw new UnauthorizedError('Invalid or missing job secret')
    }
  })

  .post(
    '/notificar-polizas-por-vencer',
    async ({ query, notificacionService, jsonOk }) => {
      const resumen = await notificacionService.notificarPolizasPorVencer(query.hoy ?? new Date())
      return jsonOk(resumen, 'Job finished')
    },
    {
      query: jobQuery,
      detail: {
        tags: ['Jobs'],
        summary: 'Notify polizas about to expire',
        description:
          'Meant to run once a day from an external scheduler. Requires the `x-job-secret` header. Finds polizas whose fechaVencimiento lands exactly on one of the days configured in `Company.avisoVencimientoDias`, flips them to PROXIMA_A_VENCER and mails the company OWNER. Idempotent: each (poliza, threshold) pair is recorded, so re-running the same day sends nothing. Skips companies without an active subscription. Pass `?hoy=YYYY-MM-DD` to replay a specific day.',
      },
    },
  )

  .post(
    '/notificar-hitos',
    async ({ query, notificacionService, jsonOk }) => {
      const resumen = await notificacionService.notificarHitos(query.hoy ?? new Date())
      return jsonOk(resumen, 'Job finished')
    },
    {
      query: jobQuery,
      detail: {
        tags: ['Jobs'],
        summary: 'Notify milestones overdue or about to expire',
        description:
          'Meant to run daily from an external scheduler. Requires the `x-job-secret` header. Looks at open hitos flagged with `alerta = true` whose company has an active subscription, and mails both the assignee and the company OWNER. Overdue and due-today always notify; upcoming ones only on a day listed in `HITO_AVISO_DIAS`. Idempotent per (hito, milestone reached), so re-running the same day sends nothing. Pass `?hoy=YYYY-MM-DD` to replay a specific day.',
      },
    },
  )
