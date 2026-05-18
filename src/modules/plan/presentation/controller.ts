import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { planServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import { createPlanSchema, listPlanQuerySchema, updatePlanSchema } from './schemas'

const PLAN_SORT_FIELDS = ['createdAt', 'updatedAt', 'nombre', 'precio'] as const

export const planController = new Elysia({ name: '@app/modules/plan', prefix: '/plans' })
  .use(authRouter)
  .use(planServicePlugin)

  .get(
    '/',
    async ({ query, pageable, userRole, planService, jsonOk }) => {
      const active = userRole === UserRole.OWNER ? true : query.active
      const page = await planService.list(pageable, { active })
      return jsonOk(page)
    },
    {
      query: listPlanQuerySchema,
      paginated: { sortFields: PLAN_SORT_FIELDS },
      withRole: [UserRole.MASTER_ADMIN, UserRole.OWNER],
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
    async ({ params, userRole, planService, jsonOk }) => {
      const plan =
        userRole === UserRole.OWNER
          ? await planService.getActiveById(params.id)
          : await planService.getCompleteById(params.id)
      return jsonOk(plan)
    },
    {
      params: idParams,
      withRole: [UserRole.MASTER_ADMIN, UserRole.OWNER],
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
    '/deactivate/:id',
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
