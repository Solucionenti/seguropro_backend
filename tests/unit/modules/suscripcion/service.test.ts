import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Periodicidad, ResourceStatus, SuscripcionStatus } from '@gen/enums'
import { SuscripcionService } from '@/modules/suscripcion/application/service'
import type { CompanyProvider } from '@/modules/suscripcion/domain/company-provider'
import type {
  CompanyBasicInfo,
  PlanBasicInfo,
  Suscripcion,
  SuscripcionWithDetails,
} from '@/modules/suscripcion/domain/entities'
import type { PlanProvider } from '@/modules/suscripcion/domain/plan-provider'
import type { SuscripcionRepository } from '@/modules/suscripcion/domain/repository'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

// ── Factories ────────────────────────────────────────────

const company: CompanyBasicInfo = {
  id: 'company-1',
  nombreComercial: 'Acme SA',
  razonSocial: null,
}

const plan: PlanBasicInfo = {
  id: 'plan-1',
  nombre: 'Plan Básico',
  precio: 99.99,
  periodicidad: Periodicidad.MENSUAL,
}

function createMockSuscripcion(overrides: Partial<Suscripcion> = {}): Suscripcion {
  return {
    id: 'sus-1',
    companyId: 'company-1',
    planId: 'plan-1',
    suscripcionStatus: SuscripcionStatus.TRIAL,
    active: true,
    fechaInicio: new Date('2025-01-01'),
    fechaFin: null,
    fechaProximoPago: new Date('2025-02-01'),
    renovacionAutomatica: true,
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

function createMockWithDetails(overrides: Partial<Suscripcion> = {}): SuscripcionWithDetails {
  return { ...createMockSuscripcion(overrides), company, plan }
}

// ── Mocks ────────────────────────────────────────────────

function createMocks() {
  const repo: Mocked<SuscripcionRepository> = {
    findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
    findById: mock(() => Promise.resolve(null)),
    findActiveByCompany: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(createMockWithDetails())),
    update: mock(() => Promise.resolve(createMockWithDetails())),
    deactivateByCompany: mock(() => Promise.resolve()),
    deactivate: mock(() => Promise.resolve()),
  }
  const companyProvider: Mocked<CompanyProvider> = {
    findActiveById: mock(() => Promise.resolve(company)),
  }
  const planProvider: Mocked<PlanProvider> = {
    findActiveById: mock(() => Promise.resolve(plan)),
  }
  return { repo, companyProvider, planProvider }
}

// ── Tests ────────────────────────────────────────────────

describe('SuscripcionService', () => {
  let service: SuscripcionService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new SuscripcionService(mocks.repo, mocks.companyProvider, mocks.planProvider)
  })

  // ── list ─────────────────────────────────────────────

  describe('list', () => {
    it('should return paginated list', async () => {
      const items = [createMockWithDetails(), createMockWithDetails({ id: 'sus-2' })]
      mocks.repo.findAll.mockResolvedValue({ data: items, total: 2 })

      const result = await service.list(1, 20, {})

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(mocks.repo.findAll).toHaveBeenCalledWith(1, 20, {})
    })

    it('should forward filters to repository', async () => {
      mocks.repo.findAll.mockResolvedValue({ data: [], total: 0 })

      await service.list(1, 10, { companyId: 'company-1', active: true })

      expect(mocks.repo.findAll).toHaveBeenCalledWith(1, 10, {
        companyId: 'company-1',
        active: true,
      })
    })
  })

  // ── create ───────────────────────────────────────────

  describe('create', () => {
    const baseInput = {
      companyId: 'company-1',
      planId: 'plan-1',
      suscripcionStatus: SuscripcionStatus.TRIAL,
      fechaInicio: new Date('2025-01-01'),
      fechaProximoPago: new Date('2025-02-01'),
    }

    it('should create subscription when company and plan are valid', async () => {
      const created = createMockWithDetails()
      mocks.repo.create.mockResolvedValue(created)

      const result = await service.create(baseInput)

      expect(mocks.companyProvider.findActiveById).toHaveBeenCalledWith('company-1')
      expect(mocks.planProvider.findActiveById).toHaveBeenCalledWith('plan-1')
      expect(mocks.repo.create).toHaveBeenCalled()
      expect(result.company.id).toBe('company-1')
    })

    it('should throw ValidationError when company not found', async () => {
      mocks.companyProvider.findActiveById.mockResolvedValue(null)

      expect(service.create(baseInput)).rejects.toBeInstanceOf(ValidationError)
    })

    it('should throw ValidationError when plan not found or inactive', async () => {
      mocks.planProvider.findActiveById.mockResolvedValue(null)

      expect(service.create(baseInput)).rejects.toBeInstanceOf(ValidationError)
    })

    it('should throw ValidationError when active=true with invalid status', async () => {
      expect(
        service.create({
          ...baseInput,
          active: true,
          suscripcionStatus: SuscripcionStatus.CANCELADA,
        }),
      ).rejects.toBeInstanceOf(ValidationError)
    })

    it('should allow active=true with ACTIVA status', async () => {
      const input = { ...baseInput, active: true, suscripcionStatus: SuscripcionStatus.ACTIVA }
      await service.create(input)

      expect(mocks.repo.create).toHaveBeenCalledWith(expect.objectContaining({ active: true }))
    })

    it('should allow active=false with any status', async () => {
      await service.create({
        ...baseInput,
        active: false,
        suscripcionStatus: SuscripcionStatus.CANCELADA,
      })

      expect(mocks.repo.create).toHaveBeenCalledWith(expect.objectContaining({ active: false }))
    })
  })

  // ── getById ──────────────────────────────────────────

  describe('getById', () => {
    it('should return subscription with details', async () => {
      mocks.repo.findById.mockResolvedValue(createMockWithDetails())

      const result = await service.getById('sus-1')

      expect(result.id).toBe('sus-1')
      expect(result.company.id).toBe('company-1')
      expect(result.plan.id).toBe('plan-1')
    })

    it('should throw NotFoundError when not found', async () => {
      expect(service.getById('nonexistent')).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  // ── update ───────────────────────────────────────────

  describe('update', () => {
    it('should update subscription fields', async () => {
      mocks.repo.findById.mockResolvedValue(createMockWithDetails())
      const updated = createMockWithDetails({ renovacionAutomatica: false })
      mocks.repo.update.mockResolvedValue(updated)

      const result = await service.update('sus-1', { renovacionAutomatica: false })

      expect(mocks.repo.update).toHaveBeenCalledWith('sus-1', { renovacionAutomatica: false })
      expect(result.renovacionAutomatica).toBe(false)
    })

    it('should throw NotFoundError when subscription not found', async () => {
      expect(service.update('nonexistent', {})).rejects.toBeInstanceOf(NotFoundError)
    })

    it('should throw ValidationError when setting active=true with incompatible status', async () => {
      mocks.repo.findById.mockResolvedValue(
        createMockWithDetails({ suscripcionStatus: SuscripcionStatus.CANCELADA }),
      )

      expect(service.update('sus-1', { active: true })).rejects.toBeInstanceOf(ValidationError)
    })

    it('should allow active=true when updating status to ACTIVA in the same call', async () => {
      mocks.repo.findById.mockResolvedValue(
        createMockWithDetails({ suscripcionStatus: SuscripcionStatus.CANCELADA }),
      )
      mocks.repo.update.mockResolvedValue(
        createMockWithDetails({ suscripcionStatus: SuscripcionStatus.ACTIVA, active: true }),
      )

      const result = await service.update('sus-1', {
        active: true,
        suscripcionStatus: SuscripcionStatus.ACTIVA,
      })

      expect(result.active).toBe(true)
    })
  })

  // ── deactivate ───────────────────────────────────────

  describe('deactivate', () => {
    it('should deactivate existing subscription', async () => {
      mocks.repo.findById.mockResolvedValue(createMockWithDetails())

      await service.deactivate('sus-1')

      expect(mocks.repo.deactivate).toHaveBeenCalledWith('sus-1')
    })

    it('should throw NotFoundError when subscription not found', async () => {
      expect(service.deactivate('nonexistent')).rejects.toBeInstanceOf(NotFoundError)
    })
  })
})
