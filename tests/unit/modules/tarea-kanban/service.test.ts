import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ResourceStatus } from '@gen/enums'
import { TareaKanbanService } from '@/modules/tarea-kanban/application/service'
import type { TareaKanbanColumnaProvider } from '@/modules/tarea-kanban/domain/columna-kanban-provider'
import type { TareaKanban } from '@/modules/tarea-kanban/domain/entities'
import type { TareaKanbanPolizaProvider } from '@/modules/tarea-kanban/domain/poliza-provider'
import type { TareaKanbanRepository } from '@/modules/tarea-kanban/domain/repository'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

const defaultPageable = new Pageable(1, 20)

function createMockTarea(overrides: Partial<TareaKanban> = {}): TareaKanban {
  return {
    id: 'tarea-1',
    companyId: 'company-1',
    columnaKanbanId: 'kanban-1',
    polizaId: 'poliza-1',
    titulo: 'Dar seguimiento',
    descripcion: 'Contactar al cliente',
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

function createMocks() {
  const repo: Mocked<TareaKanbanRepository> = {
    findAll: mock(() => Promise.resolve(Page.empty<TareaKanban>(defaultPageable))),
    findById: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(createMockTarea())),
    update: mock(() => Promise.resolve(createMockTarea())),
    hardDelete: mock(() => Promise.resolve()),
  }
  const columnaProvider: Mocked<TareaKanbanColumnaProvider> = {
    findActiveByIdForCompany: mock(() => Promise.resolve(true)),
  }
  const polizaProvider: Mocked<TareaKanbanPolizaProvider> = {
    findActiveByIdForCompany: mock(() => Promise.resolve(true)),
  }
  return { repo, columnaProvider, polizaProvider }
}

describe('TareaKanbanService', () => {
  let service: TareaKanbanService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new TareaKanbanService(mocks.repo, mocks.columnaProvider, mocks.polizaProvider)
  })

  describe('list', () => {
    it('should list tasks scoped to the company with filters', async () => {
      await service.list(defaultPageable, {
        companyId: 'company-1',
        columnaKanbanId: 'kanban-1',
        polizaId: 'poliza-1',
        titulo: 'seguimiento',
      })

      expect(mocks.repo.findAll).toHaveBeenCalledWith(defaultPageable, {
        companyId: 'company-1',
        columnaKanbanId: 'kanban-1',
        polizaId: 'poliza-1',
        titulo: 'seguimiento',
      })
    })
  })

  describe('create', () => {
    it('should create a general task without a column or poliza', async () => {
      await service.create({
        companyId: 'company-1',
        titulo: 'Revisar pendientes',
      })

      expect(mocks.columnaProvider.findActiveByIdForCompany).not.toHaveBeenCalled()
      expect(mocks.polizaProvider.findActiveByIdForCompany).not.toHaveBeenCalled()
      expect(mocks.repo.create).toHaveBeenCalledWith({
        companyId: 'company-1',
        columnaKanbanId: null,
        polizaId: null,
        titulo: 'Revisar pendientes',
        descripcion: null,
      })
    })

    it('should validate and create a task with a column and poliza', async () => {
      await service.create({
        companyId: 'company-1',
        columnaKanbanId: 'kanban-1',
        polizaId: 'poliza-1',
        titulo: 'Dar seguimiento',
        descripcion: 'Contactar al cliente',
      })

      expect(mocks.columnaProvider.findActiveByIdForCompany).toHaveBeenCalledWith(
        'kanban-1',
        'company-1',
      )
      expect(mocks.polizaProvider.findActiveByIdForCompany).toHaveBeenCalledWith(
        'poliza-1',
        'company-1',
      )
    })

    it('should reject a column from another company', async () => {
      mocks.columnaProvider.findActiveByIdForCompany.mockResolvedValue(false)

      expect(
        service.create({
          companyId: 'company-1',
          columnaKanbanId: 'other-company-column',
          titulo: 'Tarea inválida',
        }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should reject a poliza from another company', async () => {
      mocks.polizaProvider.findActiveByIdForCompany.mockResolvedValue(false)

      expect(
        service.create({
          companyId: 'company-1',
          polizaId: 'other-company-poliza',
          titulo: 'Tarea inválida',
        }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should return a task from the company', async () => {
      mocks.repo.findById.mockResolvedValue(createMockTarea())

      const result = await service.getById('tarea-1', 'company-1')

      expect(result.id).toBe('tarea-1')
      expect(mocks.repo.findById).toHaveBeenCalledWith('tarea-1', 'company-1')
    })

    it('should throw when the task is missing or belongs to another company', async () => {
      expect(service.getById('missing', 'company-1')).rejects.toThrow(NotFoundError)
    })
  })

  describe('update', () => {
    it('should update task details and allow clearing optional relations', async () => {
      const existing = createMockTarea()
      mocks.repo.findById.mockResolvedValue(existing)
      mocks.repo.update.mockResolvedValue({ ...existing, columnaKanbanId: null, polizaId: null })

      await service.update('tarea-1', 'company-1', {
        titulo: 'Tarea actualizada',
        columnaKanbanId: null,
        polizaId: null,
      })

      expect(mocks.repo.update).toHaveBeenCalledWith('tarea-1', {
        titulo: 'Tarea actualizada',
        columnaKanbanId: null,
        polizaId: null,
      })
    })

    it('should validate a new column when moving a task', async () => {
      mocks.repo.findById.mockResolvedValue(createMockTarea())
      mocks.columnaProvider.findActiveByIdForCompany.mockResolvedValue(false)

      expect(
        service.update('tarea-1', 'company-1', { columnaKanbanId: 'inactive-column' }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })

    it('should throw when updating a missing task', async () => {
      expect(service.update('missing', 'company-1', { titulo: 'No existe' })).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('hardDelete', () => {
    it('should permanently delete an existing task', async () => {
      mocks.repo.findById.mockResolvedValue(createMockTarea())

      await service.hardDelete('tarea-1', 'company-1')

      expect(mocks.repo.hardDelete).toHaveBeenCalledWith('tarea-1')
    })

    it('should not delete a missing task', async () => {
      expect(service.hardDelete('missing', 'company-1')).rejects.toThrow(NotFoundError)
      expect(mocks.repo.hardDelete).not.toHaveBeenCalled()
    })
  })
})
