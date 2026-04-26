import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { planServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import { createPlanSchema, listPlanQuerySchema, updatePlanSchema } from './schemas'

export const planController = new Elysia({ name: '@app/modules/plan', prefix: '/plans' })
  .use(authRouter)
  .use(planServicePlugin)

  .get(
    '/',
    async ({ query, planService, jsonPaginated }) => {
      const { data, total } = await planService.list(query.page, query.pageSize, query.active)
      return jsonPaginated(data, total, query.page, query.pageSize)
    },
    {
      query: listPlanQuerySchema,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Plans'], summary: 'List plans' },
    },
  )

  .post(
    '/',
    async ({ body, planService, jsonOk }) => {
      const plan = await planService.create(body)
      return jsonOk(plan, 'Plan created successfully')
    },
    {
      body: createPlanSchema,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Plans'], summary: 'Create plan' },
    },
  )

  .get(
    '/:id',
    async ({ params, planService, jsonOk }) => {
      const plan = await planService.getById(params.id)
      return jsonOk(plan)
    },
    {
      params: idParams,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Plans'], summary: 'Get plan detail' },
    },
  )

  .patch(
    '/:id',
    async ({ params, body, planService, jsonOk }) => {
      const plan = await planService.update(params.id, body)
      return jsonOk(plan, 'Plan updated successfully')
    },
    {
      params: idParams,
      body: updatePlanSchema,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Plans'], summary: 'Update plan' },
    },
  )

  .delete(
    '/:id',
    async ({ params, planService, jsonOkNoData }) => {
      await planService.deactivate(params.id)
      return jsonOkNoData('Plan deactivated successfully')
    },
    {
      params: idParams,
      withRole: UserRole.MASTER_ADMIN,
      detail: { tags: ['Plans'], summary: 'Deactivate plan' },
    },
  )
