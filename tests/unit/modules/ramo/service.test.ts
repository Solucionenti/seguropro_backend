import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ResourceStatus } from '@gen/enums'
import { RamoService } from '@/modules/ramo/application/service'
import type { Ramo } from '@/modules/ramo/domain/entities'
import type { RamoRepository } from '@/modules/ramo/domain/repository'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

const defaultPageable = new Pageable(1, 20)

function createMockRamo(overrides: Partial<Ramo> = {}): Ramo {
  return {
    id: 'ramo-1',
    companyId: 'company-1',
    nombre: 'Autos',
    descripcion: null,
    active: true,
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

function createMocks() {
  const repo: Mocked<RamoRepository> = {
    findAll: mock(() => Promise.resolve(Page.empty<Ramo>(defaultPageable))),
    findById: mock(() => Promise.resolve(null)),
    findByNombreAndCompany: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(createMockRamo())),
    update: mock(() => Promise.resolve(createMockRamo())),
    softDelete: mock(() => Promise.resolve()),
  }
  return { repo }
}

describe('RamoService', () => {
  let service: RamoService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new RamoService(mocks.repo)
  })

  describe('list', () => {
    it('should return paginated results for the company', async () => {
      const items = [createMockRamo(), createMockRamo({ id: 'ramo-2', nombre: 'Vida' })]
      mocks.repo.findAll.mockResolvedValue(Page.of(items, 2, defaultPageable))

      const result = await service.list(defaultPageable, { companyId: 'company-1' })

      expect(result.total).toBe(2)
      expect(result.content).toHaveLength(2)
      expect(mocks.repo.findAll).toHaveBeenCalledWith(defaultPageable, { companyId: 'company-1' })
    })

    it('should pass nombre filter to repo', async () => {
      await service.list(defaultPageable, { companyId: 'company-1', nombre: 'Auto' })
      expect(mocks.repo.findAll).toHaveBeenCalledWith(defaultPageable, {
        companyId: 'company-1',
        nombre: 'Auto',
      })
    })
  })

  describe('create', () => {
    it('should create ramo when nombre is unique', async () => {
      const result = await service.create({ companyId: 'company-1', nombre: 'Autos' })

      expect(mocks.repo.findByNombreAndCompany).toHaveBeenCalledWith('Autos', 'company-1')
      expect(mocks.repo.create).toHaveBeenCalledWith({
        companyId: 'company-1',
        nombre: 'Autos',
        descripcion: null,
      })
      expect(result.nombre).toBe('Autos')
    })

    it('should throw ValidationError when nombre already exists', async () => {
      mocks.repo.findByNombreAndCompany.mockResolvedValue(createMockRamo())

      expect(service.create({ companyId: 'company-1', nombre: 'Autos' })).rejects.toThrow(
        ValidationError,
      )
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should return the ramo when found', async () => {
      mocks.repo.findById.mockResolvedValue(createMockRamo())

      const result = await service.getById('ramo-1', 'company-1')

      expect(result.id).toBe('ramo-1')
      expect(mocks.repo.findById).toHaveBeenCalledWith('ramo-1', 'company-1')
    })

    it('should throw NotFoundError when missing', async () => {
      expect(service.getById('missing', 'company-1')).rejects.toThrow(NotFoundError)
    })
  })

  describe('update', () => {
    it('should update fields successfully', async () => {
      mocks.repo.findById.mockResolvedValue(createMockRamo())
      mocks.repo.update.mockResolvedValue(createMockRamo({ descripcion: 'Nueva' }))

      const result = await service.update('ramo-1', 'company-1', { descripcion: 'Nueva' })

      expect(result.descripcion).toBe('Nueva')
      expect(mocks.repo.update).toHaveBeenCalledWith('ramo-1', { descripcion: 'Nueva' })
    })

    it('should reject when new nombre conflicts', async () => {
      mocks.repo.findById.mockResolvedValue(createMockRamo())
      mocks.repo.findByNombreAndCompany.mockResolvedValue(
        createMockRamo({ id: 'ramo-99', nombre: 'Vida' }),
      )

      expect(service.update('ramo-1', 'company-1', { nombre: 'Vida' })).rejects.toThrow(
        ValidationError,
      )
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })

    it('should allow same-id self-match on nombre', async () => {
      const ramo = createMockRamo()
      mocks.repo.findById.mockResolvedValue(ramo)
      mocks.repo.findByNombreAndCompany.mockResolvedValue(ramo)

      await service.update('ramo-1', 'company-1', { nombre: 'Autos' })

      expect(mocks.repo.update).toHaveBeenCalled()
    })

    it('should throw NotFoundError when missing', async () => {
      expect(service.update('missing', 'company-1', { nombre: 'X' })).rejects.toThrow(NotFoundError)
    })
  })

  describe('softDelete', () => {
    it('should call repo.softDelete when found', async () => {
      mocks.repo.findById.mockResolvedValue(createMockRamo())

      await service.softDelete('ramo-1', 'company-1')

      expect(mocks.repo.softDelete).toHaveBeenCalledWith('ramo-1')
    })

    it('should throw NotFoundError when missing', async () => {
      expect(service.softDelete('missing', 'company-1')).rejects.toThrow(NotFoundError)
      expect(mocks.repo.softDelete).not.toHaveBeenCalled()
    })
  })
})
