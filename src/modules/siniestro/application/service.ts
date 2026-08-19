import { NotFoundError } from '@/shared/domain/not-found-error'
import type { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { SiniestroWithDetails } from '../domain/entities'
import type { PolizaProvider } from '../domain/poliza-provider'
import type { SiniestroRepository } from '../domain/repository'
import type {
  CreateSiniestroServiceInput,
  ISiniestroService,
  ListSiniestrosFilters,
  UpdateSiniestroServiceInput,
} from '../domain/service'

export class SiniestroService implements ISiniestroService {
  constructor(
    private readonly repo: SiniestroRepository,
    private readonly polizaProvider: PolizaProvider,
  ) {}

  async list(
    pageable: Pageable,
    filters: ListSiniestrosFilters,
  ): Promise<Page<SiniestroWithDetails>> {
    return this.repo.findAll(pageable, filters)
  }

  async create(input: CreateSiniestroServiceInput): Promise<SiniestroWithDetails> {
    const poliza = await this.polizaProvider.findActiveByIdForCompany(
      input.polizaId,
      input.companyId,
    )

    if (!poliza) {
      throw new ValidationError('Poliza not found for this company')
    }

    this.assertMonto(input.montoEstimado, 'montoEstimado')

    if (input.fechaEvento > new Date()) {
      throw new ValidationError('fechaEvento cannot be in the future')
    }
    // El evento debe haber ocurrido dentro de la vigencia de la póliza.
    if (input.fechaEvento < poliza.fechaInicio || input.fechaEvento > poliza.fechaVencimiento) {
      throw new ValidationError(
        'fechaEvento must fall within the poliza coverage period (fechaInicio..fechaVencimiento)',
      )
    }

    // clienteUserId se deriva de la póliza: nunca se recibe del cliente HTTP.
    return this.repo.create({
      companyId: input.companyId,
      polizaId: input.polizaId,
      clienteUserId: poliza.clienteUserId,
      creadoPorUserId: input.creadoPorUserId,
      fechaEvento: input.fechaEvento,
      tipoSiniestro: input.tipoSiniestro ?? null,
      descripcion: input.descripcion ?? null,
      ajustador: input.ajustador ?? null,
      montoEstimado: input.montoEstimado ?? null,
      siniestroStatus: input.siniestroStatus,
    })
  }

  async getById(
    id: string,
    companyId: string,
    clienteUserId?: string,
  ): Promise<SiniestroWithDetails> {
    const siniestro = await this.repo.findById(id, companyId, clienteUserId)
    if (!siniestro) {
      throw new NotFoundError('Siniestro', id)
    }
    return siniestro
  }

  async update(
    id: string,
    companyId: string,
    input: UpdateSiniestroServiceInput,
  ): Promise<SiniestroWithDetails> {
    await this.getById(id, companyId)

    this.assertMonto(input.montoEstimado, 'montoEstimado')
    this.assertMonto(input.montoPagado, 'montoPagado')

    return this.repo.update(id, input)
  }

  async softDelete(id: string, companyId: string): Promise<void> {
    await this.getById(id, companyId)
    return this.repo.softDelete(id)
  }

  private assertMonto(value: number | undefined, field: string): void {
    if (value !== undefined && value < 0) {
      throw new ValidationError(`${field} must be non-negative`)
    }
  }
}
