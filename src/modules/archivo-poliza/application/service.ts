import type { FileStorage } from '@/shared/domain/file-storage'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, type Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { ArchivoPoliza, ArchivoPolizaView } from '../domain/entities'
import type { PlanStorageProvider } from '../domain/plan-storage-provider'
import type { PolizaProvider } from '../domain/poliza-provider'
import type { ArchivoPolizaRepository } from '../domain/repository'
import type {
  ArchivoPolizaScope,
  IArchivoPolizaService,
  UploadArchivoPolizaInput,
} from '../domain/service'

// business rule, kept out of the zod schema so it has a single owner
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const BYTES_PER_GB = 1024 ** 3

interface ArchivoPolizaConfig {
  maxFileSizeBytes: number
}

export class ArchivoPolizaService implements IArchivoPolizaService {
  constructor(
    private readonly repo: ArchivoPolizaRepository,
    private readonly polizaProvider: PolizaProvider,
    private readonly storage: FileStorage,
    private readonly planStorageProvider: PlanStorageProvider,
    private readonly config: ArchivoPolizaConfig,
  ) {}

  async list(scope: ArchivoPolizaScope, pageable: Pageable): Promise<Page<ArchivoPolizaView>> {
    await this.assertPolizaAccessible(scope)

    const page = await this.repo.findAllByPoliza(scope.polizaId, pageable)
    const content = await Promise.all(page.content.map((archivo) => this.toView(archivo)))

    return new Page(content, page.total, page.page, page.pageSize)
  }

  async upload(
    scope: ArchivoPolizaScope,
    input: UploadArchivoPolizaInput,
  ): Promise<ArchivoPolizaView> {
    await this.assertPolizaAccessible(scope)
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

    await this.assertPlanStorageLimit(scope.companyId, sizeBytes)

    const stored = await this.storage.upload({
      body: input.body,
      contentType: input.mimeType,
      originalName: input.originalName,
    })

    const archivo = await this.repo.create({
      polizaId: scope.polizaId,
      nombre: input.nombre?.trim() || input.originalName,
      mimeType: input.mimeType,
      storageKey: stored.storageKey,
      tamanoBytes: stored.sizeBytes,
    })

    return this.toView(archivo)
  }

  async getById(id: string, scope: ArchivoPolizaScope): Promise<ArchivoPolizaView> {
    return this.toView(await this.findOrThrow(id, scope))
  }

  async rename(id: string, scope: ArchivoPolizaScope, nombre: string): Promise<ArchivoPolizaView> {
    await this.findOrThrow(id, scope)
    return this.toView(await this.repo.update(id, { nombre }))
  }

  // the row survives for traceability, so the binary is left in the storage too
  async softDelete(id: string, scope: ArchivoPolizaScope): Promise<void> {
    await this.findOrThrow(id, scope)
    return this.repo.softDelete(id)
  }

  private async findOrThrow(id: string, scope: ArchivoPolizaScope): Promise<ArchivoPoliza> {
    await this.assertPolizaAccessible(scope)

    const archivo = await this.repo.findByIdForPoliza(id, scope.polizaId)
    if (!archivo) {
      throw new NotFoundError('ArchivoPoliza', id)
    }
    return archivo
  }

  private async toView({ storageKey, ...archivo }: ArchivoPoliza): Promise<ArchivoPolizaView> {
    return { ...archivo, url: await this.storage.signedUrl(storageKey) }
  }

  // notFound instead of forbidden so a foreign poliza looks the same as a missing one
  private async assertPolizaAccessible(scope: ArchivoPolizaScope): Promise<void> {
    const poliza = await this.polizaProvider.findActiveByIdForCompany(
      scope.polizaId,
      scope.companyId,
    )

    if (!poliza) {
      throw new NotFoundError('Poliza', scope.polizaId)
    }
    if (scope.clienteUserId && poliza.clienteUserId !== scope.clienteUserId) {
      throw new NotFoundError('Poliza', scope.polizaId)
    }
  }

  private async assertPlanStorageLimit(companyId: string, incomingBytes: number): Promise<void> {
    const limitGB = await this.planStorageProvider.findLimitGBForCompany(companyId)
    if (limitGB === null) return

    const usedBytes = await this.repo.sumBytesByCompany(companyId)
    if (usedBytes + incomingBytes > limitGB * BYTES_PER_GB) {
      throw new ValidationError(`storage limit of ${limitGB} GB exceeded for this company`)
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
