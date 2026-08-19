import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { tareaKanbanServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import { createTareaKanbanSchema, tareaKanbanListQuery, updateTareaKanbanSchema } from './schemas'

const TAREA_KANBAN_SORT_FIELDS = ['createdAt', 'updatedAt', 'titulo'] as const

export const tareaKanbanController = new Elysia({
  name: '@app/modules/tarea-kanban',
  prefix: '/tareas-kanban',
})
  .use(authRouter)
  .use(tareaKanbanServicePlugin)

  .get(
    '/',
    async ({ query, pageable, companyId, tareaKanbanService, jsonOk }) => {
      const page = await tareaKanbanService.list(pageable, {
        companyId,
        columnaKanbanId: query.columnaKanbanId,
        polizaId: query.polizaId,
        titulo: query.titulo,
      })
      return jsonOk(page)
    },
    {
      query: tareaKanbanListQuery,
      paginated: { sortFields: TAREA_KANBAN_SORT_FIELDS },
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Tareas Kanban'],
        summary: 'List Kanban tasks',
        description: 'Returns active Kanban tasks for the authenticated company.',
      },
    },
  )

  .post(
    '/',
    async ({ body, companyId, tareaKanbanService, jsonOk }) => {
      const tarea = await tareaKanbanService.create({
        companyId,
        columnaKanbanId: body.columnaKanbanId,
        polizaId: body.polizaId,
        titulo: body.titulo,
        descripcion: body.descripcion,
      })
      return jsonOk(tarea, 'Kanban task created successfully')
    },
    {
      body: createTareaKanbanSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Tareas Kanban'],
        summary: 'Create Kanban task',
        description:
          'Creates a task for the authenticated company. The column and policy relationships are optional and tenant-scoped.',
      },
    },
  )

  .get(
    '/:id',
    async ({ params, companyId, tareaKanbanService, jsonOk }) => {
      const tarea = await tareaKanbanService.getById(params.id, companyId)
      return jsonOk(tarea)
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Tareas Kanban'],
        summary: 'Get Kanban task detail',
        description: 'Returns a Kanban task belonging to the authenticated company.',
      },
    },
  )

  .patch(
    '/:id',
    async ({ params, body, companyId, tareaKanbanService, jsonOk }) => {
      const tarea = await tareaKanbanService.update(params.id, companyId, body)
      return jsonOk(tarea, 'Kanban task updated successfully')
    },
    {
      params: idParams,
      body: updateTareaKanbanSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Tareas Kanban'],
        summary: 'Update Kanban task',
        description:
          'Updates task details and optionally moves it to another active column in the same company.',
      },
    },
  )

  .delete(
    '/:id',
    async ({ params, companyId, tareaKanbanService, jsonOkNoData }) => {
      await tareaKanbanService.hardDelete(params.id, companyId)
      return jsonOkNoData('Kanban task deleted permanently')
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Tareas Kanban'],
        summary: 'Delete Kanban task permanently',
        description: 'Permanently deletes a Kanban task from the authenticated company.',
      },
    },
  )
