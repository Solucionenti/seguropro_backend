import { UserRole } from '@gen/enums'
import { Elysia } from 'elysia'
import { archivoSiniestroServicePlugin } from '@/config/services'
import { authRouter } from '@/shared/routers/auth-router'
import { pageableSchema } from '@/shared/utils/pagination'
import {
  archivoScopeParams,
  renameArchivoSiniestroSchema,
  siniestroScopeParams,
  uploadArchivoSiniestroSchema,
} from './schemas'

const ARCHIVO_SORT_FIELDS = ['createdAt', 'updatedAt', 'nombre', 'mimeType'] as const

export const archivoSiniestroController = new Elysia({
  name: '@app/modules/archivo-siniestro',
  prefix: '/siniestros/:id/archivos',
})
  .use(authRouter)
  .use(archivoSiniestroServicePlugin)

  .get(
    '/',
    async ({ params, pageable, companyId, userId, userRole, archivoSiniestroService, jsonOk }) => {
      const clienteUserId = userRole === UserRole.CLIENT ? userId : undefined
      const page = await archivoSiniestroService.list(
        { siniestroId: params.id, companyId, clienteUserId },
        pageable,
      )
      return jsonOk(page)
    },
    {
      params: siniestroScopeParams,
      query: pageableSchema,
      paginated: { sortFields: ARCHIVO_SORT_FIELDS },
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT, UserRole.CLIENT],
      detail: {
        tags: ['Archivos de Siniestro'],
        summary: 'List siniestro files',
        description:
          'Returns a paginated list of files attached to a siniestro. Every item carries a freshly signed, expiring url. CLIENT can only list files of their own siniestros.',
      },
    },
  )

  .post(
    '/',
    async ({ params, body, companyId, archivoSiniestroService, jsonOk }) => {
      const archivo = await archivoSiniestroService.upload(
        { siniestroId: params.id, companyId },
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
      params: siniestroScopeParams,
      body: uploadArchivoSiniestroSchema,
      type: 'multipart/form-data',
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Archivos de Siniestro'],
        summary: 'Upload a file to a siniestro',
        description:
          'Uploads the file to the storage provider and stores only its metadata. Send multipart/form-data with a `file` field and an optional `nombre`. Rejects a mimeType outside the allow-list, an empty file, a file over the size cap, and a company that would exceed its plan storage limit.',
      },
    },
  )

  .get(
    '/:archivoId',
    async ({ params, companyId, userId, userRole, archivoSiniestroService, jsonOk }) => {
      const clienteUserId = userRole === UserRole.CLIENT ? userId : undefined
      const archivo = await archivoSiniestroService.getById(params.archivoId, {
        siniestroId: params.id,
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
        tags: ['Archivos de Siniestro'],
        summary: 'Get siniestro file detail',
        description:
          'Returns the file metadata plus a freshly signed, expiring url. CLIENT can only access files of their own siniestros.',
      },
    },
  )

  .patch(
    '/:archivoId',
    async ({ params, body, companyId, archivoSiniestroService, jsonOk }) => {
      const archivo = await archivoSiniestroService.rename(
        params.archivoId,
        { siniestroId: params.id, companyId },
        body.nombre,
      )
      return jsonOk(archivo, 'Archivo updated successfully')
    },
    {
      params: archivoScopeParams,
      body: renameArchivoSiniestroSchema,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Archivos de Siniestro'],
        summary: 'Rename a siniestro file',
        description:
          'Renames the file. mimeType, storageKey and siniestroId are immutable: to replace the binary, upload a new file and deactivate this one.',
      },
    },
  )

  .delete(
    '/:archivoId',
    async ({ params, companyId, archivoSiniestroService, jsonOkNoData }) => {
      await archivoSiniestroService.softDelete(params.archivoId, {
        siniestroId: params.id,
        companyId,
      })
      return jsonOkNoData('Archivo deactivated successfully')
    },
    {
      params: archivoScopeParams,
      requireCompany: true,
      withRole: [UserRole.OWNER, UserRole.AGENT],
      detail: {
        tags: ['Archivos de Siniestro'],
        summary: 'Deactivate siniestro file',
        description:
          'Soft-deletes the file record. The record is kept for traceability and the binary is left in the storage provider.',
      },
    },
  )
