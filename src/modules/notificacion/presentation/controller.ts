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

/**
 * scheduled jobs, meant to be invoked by an external scheduler (aws lambda, cloudflare
 * worker cron, cron-job.org). there is no jwt: the `x-job-secret` header IS the
 * authorization, which is why it is compared in constant time and env.ts forces it to
 * be at least 32 chars
 */
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
        summary: 'Notify polizas about to expire (RF-POL-NOTIF-01)',
        description:
          'Meant to run once a day from an external scheduler. Requires the `x-job-secret` header. Finds polizas whose fechaVencimiento lands exactly on one of the days configured in `Company.avisoVencimientoDias`, flips them to PROXIMA_A_VENCER and mails the company OWNER. Idempotent: each (poliza, threshold) pair is recorded, so re-running the same day sends nothing. Skips companies without an active subscription. Pass `?hoy=YYYY-MM-DD` to replay a specific day.',
      },
    },
  )
