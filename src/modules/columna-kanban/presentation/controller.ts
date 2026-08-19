import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { columnaKanbanServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { idParams } from '@/shared/utils/pagination'
import {
  columnaKanbanListQuery,
  createColumnaKanbanSchema,
  updateColumnaKanbanSchema,
} from './schemas'

const COLUMNA_KANBAN_SORT_FIELDS = ['createdAt', 'updatedAt', 'nombre', 'prioridad'] as const

export const columnaKanbanController = new Elysia({
  name: '@app/modules/columna-kanban',
  prefix: '/columnas-kanban',
})
  .use(authRouter)
  .use(columnaKanbanServicePlugin)

  .get(
    '/',
    async ({ query, pageable, companyId, columnaKanbanService, jsonOk }) => {
      const page = await columnaKanbanService.list(pageable, {
        companyId,
        nombre: query.nombre,
      })
      return jsonOk(page)
    },
    {
      query: columnaKanbanListQuery,
      paginated: { sortFields: COLUMNA_KANBAN_SORT_FIELDS },
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Columnas Kanban'],
        summary: 'List Kanban columns',
        description: 'Returns the active Kanban columns configured for the authenticated company.',
      },
    },
  )

  .post(
    '/',
    async ({ body, companyId, columnaKanbanService, jsonOk }) => {
      const columna = await columnaKanbanService.create({
        companyId,
        nombre: body.nombre,
        prioridad: body.prioridad,
      })
      return jsonOk(columna, 'Kanban column created successfully')
    },
    {
      body: createColumnaKanbanSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Columnas Kanban'],
        summary: 'Create Kanban column',
        description: 'Creates a Kanban column for the authenticated company.',
      },
    },
  )

  .get(
    '/:id',
    async ({ params, companyId, columnaKanbanService, jsonOk }) => {
      const columna = await columnaKanbanService.getById(params.id, companyId)
      return jsonOk(columna)
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Columnas Kanban'],
        summary: 'Get Kanban column detail',
        description: 'Returns a Kanban column belonging to the authenticated company.',
      },
    },
  )

  .patch(
    '/:id',
    async ({ params, body, companyId, columnaKanbanService, jsonOk }) => {
      const columna = await columnaKanbanService.update(params.id, companyId, body)
      return jsonOk(columna, 'Kanban column updated successfully')
    },
    {
      params: idParams,
      body: updateColumnaKanbanSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Columnas Kanban'],
        summary: 'Update Kanban column',
        description: 'Updates the name and/or numeric priority of a Kanban column.',
      },
    },
  )

  .delete(
    '/:id',
    async ({ params, companyId, columnaKanbanService, jsonOkNoData }) => {
      await columnaKanbanService.hardDelete(params.id, companyId)
      return jsonOkNoData('Kanban column deleted permanently')
    },
    {
      params: idParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Columnas Kanban'],
        summary: 'Delete Kanban column permanently',
        description:
          'Permanently deletes a Kanban column. Tasks assigned to it lose the optional column association automatically.',
      },
    },
  )
