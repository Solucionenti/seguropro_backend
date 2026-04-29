import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { OrdenStatus, ResourceStatus } from '@gen/enums'
import { OrdenService } from '@/modules/orden/application/service'
import type {
  CompanyBasicInfo,
  Orden,
  OrdenWithDetails,
  SuscripcionBasicInfo,
} from '@/modules/orden/domain/entities'
import type { OrdenRepository } from '@/modules/orden/domain/repository'
import type { SuscripcionProvider } from '@/modules/orden/domain/suscripcion-provider'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

// ── Factories ────────────────────────────────────────────

const company: CompanyBasicInfo = {
  id: 'company-1',
  nombreComercial: 'Acme SA',
  razonSocial: null,
}

const suscripcionBasic: SuscripcionBasicInfo = {
  id: 'sus-1',
  companyId: 'company-1',
  company,
}

function createMockOrden(overrides: Partial<Orden> = {}): Orden {
  return {
    id: 'ord-1',
    suscripcionId: 'sus-1',
    cicloInicio: new Date('2025-01-01'),
    cicloFin: new Date('2025-01-31'),
    monto: 99.99,
    moneda: 'MXN',
    ordenStatus: OrdenStatus.PENDIENTE,
    active: true,
    proveedor: null,
    proveedorOrdenId: null,
    proveedorPagoId: null,
    pagadaEn: null,
    motivoFallo: null,
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

function createMockWithDetails(overrides: Partial<Orden> = {}): OrdenWithDetails {
  return { ...createMockOrden(overrides), suscripcion: suscripcionBasic }
}

// ── Mocks ────────────────────────────────────────────────

function createMocks() {
  const repo: Mocked<OrdenRepository> = {
    findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
    findById: mock(() => Promise.resolve(null)),
    findPagadaByPeriod: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(createMockWithDetails())),
    update: mock(() => Promise.resolve(createMockWithDetails())),
    deactivate: mock(() => Promise.resolve()),
  }
  const suscripcionProvider: Mocked<SuscripcionProvider> = {
    findById: mock(() => Promise.resolve({ id: 'sus-1', companyId: 'company-1' })),
    updateFechaProximoPago: mock(() => Promise.resolve()),
  }
  return { repo, suscripcionProvider }
}

// ── Tests ────────────────────────────────────────────────

describe('OrdenService', () => {
  let service: OrdenService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new OrdenService(mocks.repo, mocks.suscripcionProvider)
  })

  // ── list ─────────────────────────────────────────────

  describe('list', () => {
    it('should return paginated list', async () => {
      const items = [createMockWithDetails(), createMockWithDetails({ id: 'ord-2' })]
      mocks.repo.findAll.mockResolvedValue({ data: items, total: 2 })

      const result = await service.list(1, 20, {})

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should forward filters to repository', async () => {
      mocks.repo.findAll.mockResolvedValue({ data: [], total: 0 })

      await service.list(1, 10, { companyId: 'company-1', ordenStatus: OrdenStatus.PAGADA })

      expect(mocks.repo.findAll).toHaveBeenCalledWith(1, 10, {
        companyId: 'company-1',
        ordenStatus: OrdenStatus.PAGADA,
      })
    })
  })

  // ── create ───────────────────────────────────────────

  describe('create', () => {
    const baseInput = {
      suscripcionId: 'sus-1',
      cicloInicio: new Date('2025-01-01'),
      cicloFin: new Date('2025-01-31'),
      monto: 99.99,
      moneda: 'MXN',
      ordenStatus: OrdenStatus.PENDIENTE,
    }

    it('should create PENDIENTE order without touching fechaProximoPago', async () => {
      const created = createMockWithDetails()
      mocks.repo.create.mockResolvedValue(created)

      await service.create(baseInput)

      expect(mocks.repo.create).toHaveBeenCalledWith(baseInput)
      expect(mocks.suscripcionProvider.updateFechaProximoPago).not.toHaveBeenCalled()
    })

    it('should create PAGADA order and update fechaProximoPago to cicloFin', async () => {
      const input = { ...baseInput, ordenStatus: OrdenStatus.PAGADA }
      mocks.repo.create.mockResolvedValue(
        createMockWithDetails({ ordenStatus: OrdenStatus.PAGADA }),
      )

      await service.create(input)

      expect(mocks.suscripcionProvider.updateFechaProximoPago).toHaveBeenCalledWith(
        'sus-1',
        input.cicloFin,
      )
    })

    it('should throw ValidationError when suscripcion not found', async () => {
      mocks.suscripcionProvider.findById.mockResolvedValue(null)

      expect(service.create(baseInput)).rejects.toBeInstanceOf(ValidationError)
    })

    it('should throw ValidationError on duplicate PAGADA order for same period', async () => {
      const input = { ...baseInput, ordenStatus: OrdenStatus.PAGADA }
      mocks.repo.findPagadaByPeriod.mockResolvedValue(
        createMockOrden({ ordenStatus: OrdenStatus.PAGADA }),
      )

      expect(service.create(input)).rejects.toBeInstanceOf(ValidationError)
    })

    it('should not check for duplicate when status is not PAGADA', async () => {
      await service.create(baseInput)

      expect(mocks.repo.findPagadaByPeriod).not.toHaveBeenCalled()
    })
  })

  // ── getById ──────────────────────────────────────────

  describe('getById', () => {
    it('should return order with details', async () => {
      mocks.repo.findById.mockResolvedValue(createMockWithDetails())

      const result = await service.getById('ord-1')

      expect(result.id).toBe('ord-1')
      expect(result.suscripcion.company.id).toBe('company-1')
    })

    it('should throw NotFoundError when not found', async () => {
      expect(service.getById('nonexistent')).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  // ── update ───────────────────────────────────────────

  describe('update', () => {
    it('should update order fields', async () => {
      mocks.repo.findById.mockResolvedValue(createMockWithDetails())
      const updated = createMockWithDetails({ proveedor: 'Stripe' })
      mocks.repo.update.mockResolvedValue(updated)

      const result = await service.update('ord-1', { proveedor: 'Stripe' })

      expect(mocks.repo.update).toHaveBeenCalledWith('ord-1', { proveedor: 'Stripe' })
      expect(result.proveedor).toBe('Stripe')
    })

    it('should throw NotFoundError when order not found', async () => {
      expect(service.update('nonexistent', {})).rejects.toBeInstanceOf(NotFoundError)
    })

    it('should throw ValidationError when trying to modify a PAGADA order', async () => {
      mocks.repo.findById.mockResolvedValue(
        createMockWithDetails({ ordenStatus: OrdenStatus.PAGADA }),
      )

      expect(service.update('ord-1', { proveedor: 'Stripe' })).rejects.toBeInstanceOf(
        ValidationError,
      )
    })

    it('should update fechaProximoPago when transitioning to PAGADA', async () => {
      const existing = createMockWithDetails({
        ordenStatus: OrdenStatus.PENDIENTE,
        cicloFin: new Date('2025-01-31'),
      })
      mocks.repo.findById.mockResolvedValue(existing)
      mocks.repo.update.mockResolvedValue(
        createMockWithDetails({ ordenStatus: OrdenStatus.PAGADA }),
      )

      await service.update('ord-1', { ordenStatus: OrdenStatus.PAGADA })

      expect(mocks.suscripcionProvider.updateFechaProximoPago).toHaveBeenCalledWith(
        'sus-1',
        existing.cicloFin,
      )
    })

    it('should not update fechaProximoPago when status does not change to PAGADA', async () => {
      mocks.repo.findById.mockResolvedValue(createMockWithDetails())
      mocks.repo.update.mockResolvedValue(createMockWithDetails({ motivoFallo: 'Fondos insuf.' }))

      await service.update('ord-1', { motivoFallo: 'Fondos insuf.' })

      expect(mocks.suscripcionProvider.updateFechaProximoPago).not.toHaveBeenCalled()
    })
  })

  // ── deactivate ───────────────────────────────────────

  describe('deactivate', () => {
    it('should deactivate existing order', async () => {
      mocks.repo.findById.mockResolvedValue(createMockWithDetails())

      await service.deactivate('ord-1')

      expect(mocks.repo.deactivate).toHaveBeenCalledWith('ord-1')
    })

    it('should throw NotFoundError when order not found', async () => {
      expect(service.deactivate('nonexistent')).rejects.toBeInstanceOf(NotFoundError)
    })
  })
})
