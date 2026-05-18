import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ResourceStatus } from '@gen/enums'
import { AseguradoraService } from '@/modules/aseguradora/application/service'
import type { Aseguradora } from '@/modules/aseguradora/domain/entities'
import type { AseguradoraRepository } from '@/modules/aseguradora/domain/repository'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

const defaultPageable = new Pageable(1, 20)

// ── Factories ────────────────────────────────────────────

function createMockAseguradora(overrides: Partial<Aseguradora> = {}): Aseguradora {
  return {
    id: 'aseg-1',
    companyId: 'company-1',
    nombre: 'GNP Seguros',
    descripcion: null,
    active: true,
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

// ── Mocks ────────────────────────────────────────────────

function createMocks() {
  const repo: Mocked<AseguradoraRepository> = {
    findAll: mock(() => Promise.resolve(Page.empty<Aseguradora>(defaultPageable))),
    findById: mock(() => Promise.resolve(null)),
    findByNombreAndCompany: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(createMockAseguradora())),
    update: mock(() => Promise.resolve(createMockAseguradora())),
    softDelete: mock(() => Promise.resolve()),
  }
  return { repo }
}

// ── Tests ────────────────────────────────────────────────

describe('AseguradoraService', () => {
  let service: AseguradoraService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new AseguradoraService(mocks.repo)
  })

  describe('list', () => {
    it('should return paginated results for the company', async () => {
      const items = [
        createMockAseguradora(),
        createMockAseguradora({ id: 'aseg-2', nombre: 'AXA' }),
      ]
      mocks.repo.findAll.mockResolvedValue(Page.of(items, 2, defaultPageable))

      const result = await service.list(defaultPageable, { companyId: 'company-1' })

      expect(result.total).toBe(2)
      expect(result.content).toHaveLength(2)
      expect(mocks.repo.findAll).toHaveBeenCalledWith(defaultPageable, {
        companyId: 'company-1',
      })
    })

    it('should pass nombre search filter to repo', async () => {
      await service.list(defaultPageable, { companyId: 'company-1', nombre: 'GNP' })

      expect(mocks.repo.findAll).toHaveBeenCalledWith(defaultPageable, {
        companyId: 'company-1',
        nombre: 'GNP',
      })
    })
  })

  describe('create', () => {
    it('should create aseguradora when nombre is unique in the company', async () => {
      const input = { companyId: 'company-1', nombre: 'GNP Seguros' }

      const result = await service.create(input)

      expect(mocks.repo.findByNombreAndCompany).toHaveBeenCalledWith('GNP Seguros', 'company-1')
      expect(mocks.repo.create).toHaveBeenCalledWith({
        companyId: 'company-1',
        nombre: 'GNP Seguros',
        descripcion: null,
      })
      expect(result.nombre).toBe('GNP Seguros')
    })

    it('should throw ValidationError when nombre already exists in the company', async () => {
      mocks.repo.findByNombreAndCompany.mockResolvedValue(createMockAseguradora())

      expect(service.create({ companyId: 'company-1', nombre: 'GNP Seguros' })).rejects.toThrow(
        ValidationError,
      )
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should return the aseguradora when found', async () => {
      const aseguradora = createMockAseguradora()
      mocks.repo.findById.mockResolvedValue(aseguradora)

      const result = await service.getById('aseg-1', 'company-1')

      expect(result.id).toBe('aseg-1')
      expect(mocks.repo.findById).toHaveBeenCalledWith('aseg-1', 'company-1')
    })

    it('should throw NotFoundError when aseguradora does not exist', async () => {
      expect(service.getById('missing-id', 'company-1')).rejects.toThrow(NotFoundError)
    })

    it('should throw NotFoundError when aseguradora belongs to another company', async () => {
      // findById filters by companyId in the repo — returns null for wrong company
      expect(service.getById('aseg-1', 'other-company')).rejects.toThrow(NotFoundError)
    })
  })

  describe('update', () => {
    it('should update fields successfully', async () => {
      const aseguradora = createMockAseguradora()
      mocks.repo.findById.mockResolvedValue(aseguradora)
      mocks.repo.update.mockResolvedValue({ ...aseguradora, descripcion: 'Nueva desc' })

      const result = await service.update('aseg-1', 'company-1', { descripcion: 'Nueva desc' })

      expect(result.descripcion).toBe('Nueva desc')
      expect(mocks.repo.update).toHaveBeenCalledWith('aseg-1', { descripcion: 'Nueva desc' })
    })

    it('should allow updating nombre when the new nombre is unique', async () => {
      const aseguradora = createMockAseguradora()
      mocks.repo.findById.mockResolvedValue(aseguradora)

      await service.update('aseg-1', 'company-1', { nombre: 'Nuevo Nombre' })

      expect(mocks.repo.findByNombreAndCompany).toHaveBeenCalledWith('Nuevo Nombre', 'company-1')
      expect(mocks.repo.update).toHaveBeenCalled()
    })

    it('should throw ValidationError when new nombre conflicts with another aseguradora', async () => {
      const existing = createMockAseguradora()
      const conflict = createMockAseguradora({ id: 'aseg-99', nombre: 'AXA' })
      mocks.repo.findById.mockResolvedValue(existing)
      mocks.repo.findByNombreAndCompany.mockResolvedValue(conflict)

      expect(service.update('aseg-1', 'company-1', { nombre: 'AXA' })).rejects.toThrow(
        ValidationError,
      )
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })

    it('should allow updating nombre to the same value (no conflict)', async () => {
      const aseguradora = createMockAseguradora()
      mocks.repo.findById.mockResolvedValue(aseguradora)
      // findByNombreAndCompany returns the same record (same id)
      mocks.repo.findByNombreAndCompany.mockResolvedValue(aseguradora)

      await service.update('aseg-1', 'company-1', { nombre: 'GNP Seguros' })

      expect(mocks.repo.update).toHaveBeenCalled()
    })

    it('should throw NotFoundError when aseguradora does not exist', async () => {
      expect(service.update('missing-id', 'company-1', { nombre: 'Test' })).rejects.toThrow(
        NotFoundError,
      )
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })
  })

  describe('softDelete', () => {
    it('should call repo.softDelete when aseguradora exists', async () => {
      mocks.repo.findById.mockResolvedValue(createMockAseguradora())

      await service.softDelete('aseg-1', 'company-1')

      expect(mocks.repo.softDelete).toHaveBeenCalledWith('aseg-1')
    })

    it('should throw NotFoundError when aseguradora does not exist', async () => {
      expect(service.softDelete('missing-id', 'company-1')).rejects.toThrow(NotFoundError)
      expect(mocks.repo.softDelete).not.toHaveBeenCalled()
    })
  })
})
