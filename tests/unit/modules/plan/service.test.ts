import type { Mock } from 'bun:test'
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Periodicidad, ResourceStatus } from '@gen/enums'
import { PlanService } from '@/modules/plan/application/service'
import type { Plan } from '@/modules/plan/domain/entities'
import type { PlanRepository } from '@/modules/plan/domain/repository'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { ValidationError } from '@/shared/domain/validation-error'

type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? Mock<(...args: A) => R> : T[K]
}

// ── Factories ────────────────────────────────────────────

function createMockPlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 'plan-1',
    nombre: 'Plan Básico',
    descripcion: 'Plan de entrada',
    precio: 99.99,
    periodicidad: Periodicidad.MENSUAL,
    limiteUsuarios: 5,
    limiteAlmacenamientoGB: 10,
    features: ['feature-a', 'feature-b'],
    active: true,
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

// ── Mocks ────────────────────────────────────────────────

function createMocks() {
  const repo: Mocked<PlanRepository> = {
    findAll: mock(() => Promise.resolve({ data: [], total: 0 })),
    findById: mock(() => Promise.resolve(null)),
    findByNombre: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(createMockPlan())),
    update: mock(() => Promise.resolve(createMockPlan())),
    deactivate: mock(() => Promise.resolve()),
  }
  return { repo }
}

// ── Tests ────────────────────────────────────────────────

describe('PlanService', () => {
  let service: PlanService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new PlanService(mocks.repo)
  })

  // ── list ─────────────────────────────────────────────

  describe('list', () => {
    it('should return paginated list of plans', async () => {
      const plans = [createMockPlan(), createMockPlan({ id: 'plan-2', nombre: 'Plan Pro' })]
      mocks.repo.findAll.mockResolvedValue({ data: plans, total: 2 })

      const result = await service.list(1, 20)

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(mocks.repo.findAll).toHaveBeenCalledWith(1, 20, undefined)
    })

    it('should forward active filter to repository', async () => {
      mocks.repo.findAll.mockResolvedValue({ data: [], total: 0 })

      await service.list(1, 10, false)

      expect(mocks.repo.findAll).toHaveBeenCalledWith(1, 10, false)
    })

    it('should return empty list when no plans exist', async () => {
      const result = await service.list(1, 20)

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  // ── create ───────────────────────────────────────────

  describe('create', () => {
    it('should create a plan when nombre is unique', async () => {
      const input = {
        nombre: 'Plan Básico',
        precio: 99.99,
        periodicidad: Periodicidad.MENSUAL,
        limiteUsuarios: 5,
      }
      const created = createMockPlan(input)
      mocks.repo.create.mockResolvedValue(created)

      const result = await service.create(input)

      expect(mocks.repo.findByNombre).toHaveBeenCalledWith('Plan Básico')
      expect(mocks.repo.create).toHaveBeenCalledWith(input)
      expect(result.nombre).toBe('Plan Básico')
    })

    it('should throw ValidationError when nombre already exists', async () => {
      mocks.repo.findByNombre.mockResolvedValue(createMockPlan())

      expect(
        service.create({
          nombre: 'Plan Básico',
          precio: 99.99,
          periodicidad: Periodicidad.MENSUAL,
          limiteUsuarios: 5,
        }),
      ).rejects.toBeInstanceOf(ValidationError)
    })

    it('should create plan with optional fields', async () => {
      const input = {
        nombre: 'Plan Premium',
        precio: 299.99,
        periodicidad: Periodicidad.ANUAL,
        limiteUsuarios: 50,
        descripcion: 'Plan completo',
        limiteAlmacenamientoGB: 100,
        features: ['feature-x', 'feature-y'],
      }
      mocks.repo.create.mockResolvedValue(createMockPlan(input))

      const result = await service.create(input)

      expect(mocks.repo.create).toHaveBeenCalledWith(input)
      expect(result.precio).toBe(299.99)
    })
  })

  // ── getById ──────────────────────────────────────────

  describe('getById', () => {
    it('should return plan when found', async () => {
      const plan = createMockPlan()
      mocks.repo.findById.mockResolvedValue(plan)

      const result = await service.getById('plan-1')

      expect(result.id).toBe('plan-1')
      expect(result.nombre).toBe('Plan Básico')
    })

    it('should throw NotFoundError when plan does not exist', async () => {
      expect(service.getById('nonexistent')).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  // ── update ───────────────────────────────────────────

  describe('update', () => {
    it('should update plan fields', async () => {
      const plan = createMockPlan()
      mocks.repo.findById.mockResolvedValue(plan)
      const updated = createMockPlan({ precio: 149.99 })
      mocks.repo.update.mockResolvedValue(updated)

      const result = await service.update('plan-1', { precio: 149.99 })

      expect(mocks.repo.update).toHaveBeenCalledWith('plan-1', { precio: 149.99 })
      expect(result.precio).toBe(149.99)
    })

    it('should throw NotFoundError when plan does not exist', async () => {
      expect(service.update('nonexistent', { precio: 50 })).rejects.toBeInstanceOf(NotFoundError)
    })

    it('should throw ValidationError when updating nombre to an already taken name', async () => {
      const plan = createMockPlan()
      mocks.repo.findById.mockResolvedValue(plan)
      const otherPlan = createMockPlan({ id: 'plan-2', nombre: 'Plan Pro' })
      mocks.repo.findByNombre.mockResolvedValue(otherPlan)

      expect(service.update('plan-1', { nombre: 'Plan Pro' })).rejects.toBeInstanceOf(
        ValidationError,
      )
    })

    it('should allow updating nombre to the same plan own name', async () => {
      const plan = createMockPlan()
      mocks.repo.findById.mockResolvedValue(plan)
      mocks.repo.findByNombre.mockResolvedValue(plan)
      mocks.repo.update.mockResolvedValue(plan)

      const result = await service.update('plan-1', { nombre: 'Plan Básico' })

      expect(mocks.repo.update).toHaveBeenCalledWith('plan-1', { nombre: 'Plan Básico' })
      expect(result.id).toBe('plan-1')
    })
  })

  // ── deactivate ───────────────────────────────────────

  describe('deactivate', () => {
    it('should deactivate existing plan', async () => {
      const plan = createMockPlan()
      mocks.repo.findById.mockResolvedValue(plan)

      await service.deactivate('plan-1')

      expect(mocks.repo.deactivate).toHaveBeenCalledWith('plan-1')
    })

    it('should throw NotFoundError when plan does not exist', async () => {
      expect(service.deactivate('nonexistent')).rejects.toBeInstanceOf(NotFoundError)
    })

    it('should deactivate already-inactive plan if still active status', async () => {
      const plan = createMockPlan({ active: false })
      mocks.repo.findById.mockResolvedValue(plan)

      await service.deactivate('plan-1')

      expect(mocks.repo.deactivate).toHaveBeenCalledWith('plan-1')
    })
  })
})
