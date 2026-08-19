import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { archivoPolizaServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { pageableSchema } from '@/shared/utils/pagination'
import {
  archivoScopeParams,
  polizaScopeParams,
  renameArchivoPolizaSchema,
  uploadArchivoPolizaSchema,
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
          'Returns a paginated list of files attached to a poliza. Every item carries a freshly signed, expiring url. CLIENT can only list files of their own polizas.',
      },
    },
  )

  .post(
    '/',
    async ({ params, body, companyId, archivoPolizaService, jsonOk }) => {
      const archivo = await archivoPolizaService.upload(
        { polizaId: params.id, companyId },
        {
          body: await body.file.arrayBuffer(),
          originalName: body.file.name,
          mimeType: body.file.type,
          nombre: body.nombre,
        },
      )
      return jsonOk(archivo, 'Archivo uploaded successfully')
    },
    {
      params: polizaScopeParams,
      body: uploadArchivoPolizaSchema,
      type: 'multipart/form-data',
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Archivos de Poliza'],
        summary: 'Upload a file to a poliza',
        description:
          'Uploads the file to the storage provider and stores only its metadata. Send multipart/form-data with a `file` field and an optional `nombre`. Rejects a mimeType outside the allow-list, an empty file, a file over the size cap, and a company that would exceed its plan storage limit.',
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
          'Returns the file metadata plus a freshly signed, expiring url. CLIENT can only access files of their own polizas.',
      },
    },
  )

  .patch(
    '/:archivoId',
    async ({ params, body, companyId, archivoPolizaService, jsonOk }) => {
      const archivo = await archivoPolizaService.rename(
        params.archivoId,
        { polizaId: params.id, companyId },
        body.nombre,
      )
      return jsonOk(archivo, 'Archivo updated successfully')
    },
    {
      params: archivoScopeParams,
      body: renameArchivoPolizaSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Archivos de Poliza'],
        summary: 'Rename a poliza file',
        description:
          'Renames the file. mimeType, storageKey and polizaId are immutable: to replace the binary, upload a new file and deactivate this one.',
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
          'Soft-deletes the file record. The record is kept for traceability and the binary is left in the storage provider.',
      },
    },
  )
