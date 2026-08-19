import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { archivoPolizaServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { pageableSchema } from '@/shared/utils/pagination'
import {
  archivoScopeParams,
  createArchivoPolizaSchema,
  polizaScopeParams,
  updateArchivoPolizaSchema,
} from './schemas'

const ARCHIVO_SORT_FIELDS = ['createdAt', 'updatedAt', 'nombre', 'mimeType'] as const

export const archivoPolizaController = new Elysia({
  name: '@app/modules/archivo-poliza',
  prefix: '/polizas/:id/archivos',
})
  .use(authRouter)
  .use(archivoPolizaServicePlugin)

  .get(
    '/',
    async ({ params, pageable, companyId, userId, userRole, archivoPolizaService, jsonOk }) => {
      const clienteUserId = userRole === UserRole.CLIENT ? userId : undefined
      const page = await archivoPolizaService.list(
        { polizaId: params.id, companyId, clienteUserId },
        pageable,
      )
      return jsonOk(page)
    },
    {
      params: polizaScopeParams,
      query: pageableSchema,
      paginated: { sortFields: ARCHIVO_SORT_FIELDS },
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT, UserRole.CLIENT],
      detail: {
        tags: ['Archivos de Poliza'],
        summary: 'List poliza files',
        description:
          'Returns a paginated list of files attached to a poliza. CLIENT can only list files of their own polizas.',
      },
    },
  )

  .post(
    '/',
    async ({ params, body, companyId, archivoPolizaService, jsonOk }) => {
      const archivo = await archivoPolizaService.create({ polizaId: params.id, companyId }, body)
      return jsonOk(archivo, 'Archivo created successfully')
    },
    {
      params: polizaScopeParams,
      body: createArchivoPolizaSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Archivos de Poliza'],
        summary: 'Attach a file to a poliza',
        description:
          'Registers file metadata (nombre, mimeType, url, tamanoBytes) for a poliza. Binaries are never stored in the database: upload the file to the storage provider first and send its url here. mimeType must be one of the allowed document/image types.',
      },
    },
  )

  .get(
    '/:archivoId',
    async ({ params, companyId, userId, userRole, archivoPolizaService, jsonOk }) => {
      const clienteUserId = userRole === UserRole.CLIENT ? userId : undefined
      const archivo = await archivoPolizaService.getById(params.archivoId, {
        polizaId: params.id,
        companyId,
        clienteUserId,
      })
      return jsonOk(archivo)
    },
    {
      params: archivoScopeParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT, UserRole.CLIENT],
      detail: {
        tags: ['Archivos de Poliza'],
        summary: 'Get poliza file detail',
        description:
          'Returns metadata of one file. CLIENT can only access files of their own polizas.',
      },
    },
  )

  .patch(
    '/:archivoId',
    async ({ params, body, companyId, archivoPolizaService, jsonOk }) => {
      const archivo = await archivoPolizaService.update(
        params.archivoId,
        { polizaId: params.id, companyId },
        body,
      )
      return jsonOk(archivo, 'Archivo updated successfully')
    },
    {
      params: archivoScopeParams,
      body: updateArchivoPolizaSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Archivos de Poliza'],
        summary: 'Update poliza file metadata',
        description:
          'Updates nombre, mimeType, url and/or tamanoBytes. A file cannot be moved to a different poliza.',
      },
    },
  )

  .delete(
    '/:archivoId',
    async ({ params, companyId, archivoPolizaService, jsonOkNoData }) => {
      await archivoPolizaService.softDelete(params.archivoId, {
        polizaId: params.id,
        companyId,
      })
      return jsonOkNoData('Archivo deactivated successfully')
    },
    {
      params: archivoScopeParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Archivos de Poliza'],
        summary: 'Deactivate poliza file',
        description:
          'Soft-deletes (deactivates) the file record. The record is kept for traceability; the physical file in storage is not touched.',
      },
    },
  )
