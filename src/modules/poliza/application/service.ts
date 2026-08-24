import { PolizaStatus } from '@gen/enums'
import { NotFoundError } from '@/shared/domain/not-found-error'
import type { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { AseguradoraProvider } from '../domain/aseguradora-provider'
import type { ClienteUserProvider } from '../domain/cliente-user-provider'
import type { PolizaWithDetails } from '../domain/entities'
import type { RamoProvider } from '../domain/ramo-provider'
import type { PolizaRepository } from '../domain/repository'
import type {
  CrearRenovacionServiceInput,
  CreatePolizaServiceInput,
  IPolizaService,
  ListPolizasFilters,
  UpdatePolizaServiceInput,
} from '../domain/service'

export class PolizaService implements IPolizaService {
  constructor(
    private readonly repo: PolizaRepository,
    private readonly aseguradoraProvider: AseguradoraProvider,
    private readonly ramoProvider: RamoProvider,
    private readonly clienteProvider: ClienteUserProvider,
  ) {}

  async list(pageable: Pageable, filters: ListPolizasFilters): Promise<Page<PolizaWithDetails>> {
    return this.repo.findAll(pageable, filters)
  }

  async create(input: CreatePolizaServiceInput): Promise<PolizaWithDetails> {
    if (input.fechaVencimiento < input.fechaInicio) {
      throw new ValidationError('fechaVencimiento must be greater than or equal to fechaInicio')
    }
    if (input.primaNeta < 0 || input.primaTotal < 0) {
      throw new ValidationError('primaNeta and primaTotal must be non-negative')
    }
    if (input.primaTotal < input.primaNeta) {
      throw new ValidationError('primaTotal must be greater than or equal to primaNeta')
    }

    const [aseguradora, ramo, cliente, duplicate] = await Promise.all([
      this.aseguradoraProvider.findActiveByIdForCompany(input.aseguradoraId, input.companyId),
      this.ramoProvider.findActiveByIdForCompany(input.ramoId, input.companyId),
      this.clienteProvider.findActiveClientForCompany(input.clienteUserId, input.companyId),
      this.repo.findByNumeroAndCompany(input.numeroPoliza, input.companyId),
    ])

    if (!aseguradora) {
      throw new ValidationError('Aseguradora not found for this company')
    }
    if (!ramo) {
      throw new ValidationError('Ramo not found for this company')
    }
    if (!cliente) {
      throw new ValidationError('Cliente not found for this company')
    }
    if (duplicate) {
      throw new ValidationError(`A poliza with numeroPoliza "${input.numeroPoliza}" already exists`)
    }

    return this.repo.create({
      companyId: input.companyId,
      aseguradoraId: input.aseguradoraId,
      ramoId: input.ramoId,
      clienteUserId: input.clienteUserId,
      numeroPoliza: input.numeroPoliza,
      fechaInicio: input.fechaInicio,
      fechaVencimiento: input.fechaVencimiento,
      primaNeta: input.primaNeta,
      primaTotal: input.primaTotal,
      polizaStatus: input.polizaStatus,
    })
  }

  async getById(id: string, companyId: string, clienteUserId?: string): Promise<PolizaWithDetails> {
    const poliza = await this.repo.findById(id, companyId, clienteUserId)
    if (!poliza) {
      throw new NotFoundError('Poliza', id)
    }
    return poliza
  }

  async update(
    id: string,
    companyId: string,
    input: UpdatePolizaServiceInput,
  ): Promise<PolizaWithDetails> {
    const existing = await this.getById(id, companyId)

    const fechaVencimiento = input.fechaVencimiento ?? existing.fechaVencimiento
    if (fechaVencimiento && existing.fechaInicio && fechaVencimiento < existing.fechaInicio) {
      throw new ValidationError('fechaVencimiento must be greater than or equal to fechaInicio')
    }

    // entity catalog: numeroPoliza, fechaInicio and fechaVencimiento are mandatory as
    // soon as the poliza stops being a quote, so it cannot be emitted half filled
    const polizaStatus = input.polizaStatus ?? existing.polizaStatus
    if (polizaStatus !== PolizaStatus.COTIZACION) {
      if (!existing.numeroPoliza || !existing.fechaInicio || !fechaVencimiento) {
        throw new ValidationError(
          `numeroPoliza, fechaInicio and fechaVencimiento are required to leave COTIZACION (target status ${polizaStatus})`,
        )
      }
    }

    const primaNeta = input.primaNeta ?? existing.primaNeta
    const primaTotal = input.primaTotal ?? existing.primaTotal
    if (primaNeta < 0 || primaTotal < 0) {
      throw new ValidationError('primaNeta and primaTotal must be non-negative')
    }
    if (primaTotal < primaNeta) {
      throw new ValidationError('primaTotal must be greater than or equal to primaNeta')
    }

    return this.repo.update(id, input)
  }

  async softDelete(id: string, companyId: string): Promise<void> {
    await this.getById(id, companyId)
    return this.repo.softDelete(id)
  }

  // a renewal is born as a quote pointing back at its predecessor, with no numeroPoliza
  // and no dates. the primas are copied from the origin so the create contract, which
  // requires them, stays untouched
  async crearRenovacion(input: CrearRenovacionServiceInput): Promise<PolizaWithDetails> {
    const origen = await this.getById(input.polizaOrigenId, input.companyId)

    // one renewal per origin poliza
    const renovacionExistente = await this.repo.findRenovacionActiva(origen.id)
    if (renovacionExistente) {
      throw new ValidationError('This poliza already has an active renovacion')
    }

    return this.repo.createRenovacion({
      companyId: origen.companyId,
      aseguradoraId: origen.aseguradoraId,
      ramoId: origen.ramoId,
      clienteUserId: origen.clienteUserId,
      primaNeta: origen.primaNeta,
      primaTotal: origen.primaTotal,
      polizaAnteriorId: origen.id,
      creadoPorUserId: input.creadoPorUserId,
    })
  }
}
