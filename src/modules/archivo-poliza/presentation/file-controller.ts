import { Elysia } from 'elysia'
import { localFileStoragePlugin } from '@/config/services'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { UnauthorizedError } from '@/shared/domain/unauthorized-error'
import { publicRouter } from '@/shared/routers/public-router'
import { signedFileQuery } from './schemas'

// public on purpose: the hmac signature in the query string IS the authorization,
// which is what makes the url shareable and short lived
export const fileController = new Elysia({
  name: '@app/modules/archivo-poliza/files',
  prefix: '/files',
})
  .use(publicRouter)
  .use(localFileStoragePlugin)

  .get(
    '/:storageKey',
    async ({ params, query, localFileStorage, set }) => {
      const valid = await localFileStorage.verifySignature(
        params.storageKey,
        query.expires,
        query.signature,
      )
      if (!valid) {
        throw new UnauthorizedError('Invalid or expired file url')
      }

      const body = await localFileStorage.read(params.storageKey)
      if (!body) {
        throw new NotFoundError('File')
      }

      set.headers['content-type'] = 'application/octet-stream'
      return new Response(body)
    },
    {
      query: signedFileQuery,
      detail: {
        tags: ['Archivos de Poliza'],
        summary: 'Download a file by signed url',
        description:
          'Serves a stored file. Requires the `expires` and `signature` pair produced by the storage provider; the signature is the authorization, so no Bearer token is used. Only used by the local storage driver — a cloud provider serves its own signed urls directly.',
      },
    },
  )
