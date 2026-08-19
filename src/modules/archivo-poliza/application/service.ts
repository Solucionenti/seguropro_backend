import { NotFoundError } from '@/shared/domain/not-found-error'
import type { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { ArchivoPoliza } from '../domain/entities'
import type { PolizaProvider } from '../domain/poliza-provider'
import type { ArchivoPolizaRepository } from '../domain/repository'
import type {
  ArchivoPolizaScope,
  CreateArchivoPolizaServiceInput,
  IArchivoPolizaService,
  UpdateArchivoPolizaServiceInput,
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

export class ArchivoPolizaService implements IArchivoPolizaService {
  constructor(
    private readonly repo: ArchivoPolizaRepository,
    private readonly polizaProvider: PolizaProvider,
  ) {}

  async list(scope: ArchivoPolizaScope, pageable: Pageable): Promise<Page<ArchivoPoliza>> {
    await this.assertPolizaAccessible(scope)
    return this.repo.findAllByPoliza(scope.polizaId, pageable)
  }

  async create(
    scope: ArchivoPolizaScope,
    input: CreateArchivoPolizaServiceInput,
  ): Promise<ArchivoPoliza> {
    await this.assertPolizaAccessible(scope)
    this.assertMimeType(input.mimeType)
    this.assertNonNegative(input.tamanoBytes, 'tamanoBytes')

    return this.repo.create({
      polizaId: scope.polizaId,
      nombre: input.nombre,
      mimeType: input.mimeType,
      url: input.url,
      tamanoBytes: input.tamanoBytes ?? null,
    })
  }

  async getById(id: string, scope: ArchivoPolizaScope): Promise<ArchivoPoliza> {
    await this.assertPolizaAccessible(scope)

    const archivo = await this.repo.findByIdForPoliza(id, scope.polizaId)
    if (!archivo) {
      throw new NotFoundError('ArchivoPoliza', id)
    }
    return archivo
  }

  async update(
    id: string,
    scope: ArchivoPolizaScope,
    input: UpdateArchivoPolizaServiceInput,
  ): Promise<ArchivoPoliza> {
    await this.getById(id, scope)

    if (input.mimeType !== undefined) {
      this.assertMimeType(input.mimeType)
    }
    this.assertNonNegative(input.tamanoBytes, 'tamanoBytes')

    return this.repo.update(id, input)
  }

  async softDelete(id: string, scope: ArchivoPolizaScope): Promise<void> {
    await this.getById(id, scope)
    return this.repo.softDelete(id)
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

  private assertMimeType(mimeType: string): void {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new ValidationError(
        `mimeType "${mimeType}" is not allowed. Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      )
    }
  }

  private assertNonNegative(value: number | undefined, field: string): void {
    if (value !== undefined && value < 0) {
      throw new ValidationError(`${field} must be non-negative`)
    }
  }
}
