import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ResourceStatus } from '@gen/enums'
import { ColumnaKanbanService } from '@/modules/columna-kanban/application/service'
import type { ColumnaKanban } from '@/modules/columna-kanban/domain/entities'
import type { ColumnaKanbanRepository } from '@/modules/columna-kanban/domain/repository'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

const defaultPageable = new Pageable(1, 20)

function createMockColumna(overrides: Partial<ColumnaKanban> = {}): ColumnaKanban {
  return {
    id: 'kanban-1',
    companyId: 'company-1',
    nombre: 'Prospectos',
    prioridad: 1,
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

function createMocks() {
  const repo: Mocked<ColumnaKanbanRepository> = {
    findAll: mock(() => Promise.resolve(Page.empty<ColumnaKanban>(defaultPageable))),
    findById: mock(() => Promise.resolve(null)),
    findByPrioridadAndCompany: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(createMockColumna())),
    update: mock(() => Promise.resolve(createMockColumna())),
    hardDelete: mock(() => Promise.resolve()),
  }
  return { repo }
}

describe('ColumnaKanbanService', () => {
  let service: ColumnaKanbanService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new ColumnaKanbanService(mocks.repo)
  })

  describe('list', () => {
    it('should list columns scoped to the company', async () => {
      const columns = [createMockColumna(), createMockColumna({ id: 'kanban-2', prioridad: 2 })]
      mocks.repo.findAll.mockResolvedValue(Page.of(columns, 2, defaultPageable))

      const result = await service.list(defaultPageable, { companyId: 'company-1' })

      expect(result.content).toHaveLength(2)
      expect(mocks.repo.findAll).toHaveBeenCalledWith(defaultPageable, {
        companyId: 'company-1',
      })
    })
  })

  describe('create', () => {
    it('should create a column with a unique positive priority', async () => {
      const result = await service.create({
        companyId: 'company-1',
        nombre: 'Emitidas',
        prioridad: 2,
      })

      expect(mocks.repo.findByPrioridadAndCompany).toHaveBeenCalledWith(2, 'company-1')
      expect(mocks.repo.create).toHaveBeenCalledWith({
        companyId: 'company-1',
        nombre: 'Emitidas',
        prioridad: 2,
      })
      expect(result.id).toBe('kanban-1')
    })

    it('should reject a duplicate priority in the company', async () => {
      mocks.repo.findByPrioridadAndCompany.mockResolvedValue(createMockColumna())

      expect(
        service.create({ companyId: 'company-1', nombre: 'Duplicada', prioridad: 1 }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should reject a non-positive priority', async () => {
      expect(
        service.create({ companyId: 'company-1', nombre: 'Inválida', prioridad: 0 }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.findByPrioridadAndCompany).not.toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should return a column from the company', async () => {
      mocks.repo.findById.mockResolvedValue(createMockColumna())

      const result = await service.getById('kanban-1', 'company-1')

      expect(result.id).toBe('kanban-1')
      expect(mocks.repo.findById).toHaveBeenCalledWith('kanban-1', 'company-1')
    })

    it('should throw when the column belongs to another company or is missing', async () => {
      expect(service.getById('missing', 'company-1')).rejects.toThrow(NotFoundError)
    })
  })

  describe('update', () => {
    it('should update the column', async () => {
      const existing = createMockColumna()
      mocks.repo.findById.mockResolvedValue(existing)
      mocks.repo.update.mockResolvedValue({ ...existing, nombre: 'Renovación' })

      const result = await service.update('kanban-1', 'company-1', { nombre: 'Renovación' })

      expect(result.nombre).toBe('Renovación')
      expect(mocks.repo.update).toHaveBeenCalledWith('kanban-1', { nombre: 'Renovación' })
    })

    it('should reject a priority conflict with another column', async () => {
      mocks.repo.findById.mockResolvedValue(createMockColumna())
      mocks.repo.findByPrioridadAndCompany.mockResolvedValue(
        createMockColumna({ id: 'kanban-2', prioridad: 2 }),
      )

      expect(service.update('kanban-1', 'company-1', { prioridad: 2 })).rejects.toThrow(
        ValidationError,
      )
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })
  })

  describe('hardDelete', () => {
    it('should permanently delete an existing column', async () => {
      mocks.repo.findById.mockResolvedValue(createMockColumna())

      await service.hardDelete('kanban-1', 'company-1')

      expect(mocks.repo.hardDelete).toHaveBeenCalledWith('kanban-1')
    })

    it('should not delete a missing column', async () => {
      expect(service.hardDelete('missing', 'company-1')).rejects.toThrow(NotFoundError)
      expect(mocks.repo.hardDelete).not.toHaveBeenCalled()
    })
  })
})
