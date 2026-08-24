import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { hitoServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { alertaListQuery } from './schemas'

export const alertaController = new Elysia({
  name: '@app/modules/hito-siniestro/alertas',
  prefix: '/hitos-alertas',
})
  .use(authRouter)
  .use(hitoServicePlugin)

  .get(
    '/',
    async ({ query, pageable, companyId, hitoService, jsonOk }) => {
      const page = await hitoService.listAlertas(pageable, {
        companyId,
        diasHorizonte: query.diasHorizonte,
        severidad: query.severidad,
        asignadoAUserId: query.asignadoAUserId,
        siniestroId: query.siniestroId,
      })
      return jsonOk(page)
    },
    {
      query: alertaListQuery,
      paginated: { sortFields: ['fechaLimite'] },
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Hitos de Siniestro'],
        summary: 'Alert panel: upcoming and overdue milestones',
        description:
          'Returns the open milestones of the company whose fechaLimite falls within `diasHorizonte` days (default 7), overdue ones included. Each row carries a derived `severidad` (VENCIDO, HOY, PROXIMO) and `diasRestantes`, ordered by fechaLimite ascending so overdue comes first. Supports filtering by severidad, asignadoAUserId and siniestroId. CLIENT has no access.',
      },
    },
  )
