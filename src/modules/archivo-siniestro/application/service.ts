import { ALLOWED_MIME_TYPES } from '@/shared/domain/allowed-mime-types'
import type { FileStorage } from '@/shared/domain/file-storage'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type { StorageQuota } from '@/shared/domain/storage-quota'
import { ValidationError } from '@/shared/domain/validation-error'
import type { ArchivoSiniestro, ArchivoSiniestroView } from '../domain/entities'
import type { ArchivoSiniestroRepository } from '../domain/repository'
import type {
  ArchivoSiniestroScope,
  IArchivoSiniestroService,
  UploadArchivoSiniestroInput,
} from '../domain/service'
import type { SiniestroProvider } from '../domain/siniestro-provider'

interface ArchivoSiniestroConfig {
  maxFileSizeBytes: number
}

export class ArchivoSiniestroService implements IArchivoSiniestroService {
  constructor(
    private readonly repo: ArchivoSiniestroRepository,
    private readonly siniestroProvider: SiniestroProvider,
    private readonly storage: FileStorage,
    private readonly storageQuota: StorageQuota,
    private readonly config: ArchivoSiniestroConfig,
  ) {}

  async list(
    scope: ArchivoSiniestroScope,
    pageable: Pageable,
  ): Promise<Page<ArchivoSiniestroView>> {
    await this.assertSiniestroAccessible(scope)

    const page = await this.repo.findAllBySiniestro(scope.siniestroId, pageable)
    const content = await Promise.all(page.content.map((archivo) => this.toView(archivo)))

    return new Page(content, page.total, page.page, page.pageSize)
  }

  async upload(
    scope: ArchivoSiniestroScope,
    input: UploadArchivoSiniestroInput,
  ): Promise<ArchivoSiniestroView> {
    await this.assertSiniestroAccessible(scope)
    this.assertMimeType(input.mimeType)

    const sizeBytes = input.body.byteLength
    if (sizeBytes === 0) {
      throw new ValidationError('file is empty')
    }
    if (sizeBytes > this.config.maxFileSizeBytes) {
      throw new ValidationError(
        `file exceeds the maximum size of ${Math.round(this.config.maxFileSizeBytes / (1024 * 1024))} MB`,
      )
    }

    await this.storageQuota.assertCanStore(scope.companyId, sizeBytes)

    const stored = await this.storage.upload({
      body: input.body,
      contentType: input.mimeType,
      originalName: input.originalName,
    })

    const archivo = await this.repo.create({
      siniestroId: scope.siniestroId,
      nombre: input.nombre?.trim() || input.originalName,
      mimeType: input.mimeType,
      storageKey: stored.storageKey,
      tamanoBytes: stored.sizeBytes,
    })

    return this.toView(archivo)
  }

  async getById(id: string, scope: ArchivoSiniestroScope): Promise<ArchivoSiniestroView> {
    return this.toView(await this.findOrThrow(id, scope))
  }

  async rename(
    id: string,
    scope: ArchivoSiniestroScope,
    nombre: string,
  ): Promise<ArchivoSiniestroView> {
    await this.findOrThrow(id, scope)
    return this.toView(await this.repo.update(id, { nombre }))
  }

  // the row survives for traceability, so the binary stays in the storage
  async softDelete(id: string, scope: ArchivoSiniestroScope): Promise<void> {
    await this.findOrThrow(id, scope)
    return this.repo.softDelete(id)
  }

  private async findOrThrow(id: string, scope: ArchivoSiniestroScope): Promise<ArchivoSiniestro> {
    await this.assertSiniestroAccessible(scope)

    const archivo = await this.repo.findByIdForSiniestro(id, scope.siniestroId)
    if (!archivo) {
      throw new NotFoundError('ArchivoSiniestro', id)
    }
    return archivo
  }

  private async toView({
    storageKey,
    ...archivo
  }: ArchivoSiniestro): Promise<ArchivoSiniestroView> {
    return { ...archivo, url: await this.storage.signedUrl(storageKey) }
  }

  // notFound instead of forbidden so a foreign siniestro looks the same as a missing one
  private async assertSiniestroAccessible(scope: ArchivoSiniestroScope): Promise<void> {
    const siniestro = await this.siniestroProvider.findActiveByIdForCompany(
      scope.siniestroId,
      scope.companyId,
    )

    if (!siniestro) {
      throw new NotFoundError('Siniestro', scope.siniestroId)
    }
    if (scope.clienteUserId && siniestro.clienteUserId !== scope.clienteUserId) {
      throw new NotFoundError('Siniestro', scope.siniestroId)
    }
  }

  private assertMimeType(mimeType: string): void {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new ValidationError(
        `mimeType "${mimeType}" is not allowed. Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      )
    }
  }
}
