import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ResourceStatus } from '@gen/enums'
import { GlosarioService } from '@/modules/glosario/application/service'
import type { Glosario } from '@/modules/glosario/domain/entities'
import type { GlosarioRepository } from '@/modules/glosario/domain/repository'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

const defaultPageable = new Pageable(1, 20)

function createMockGlosario(overrides: Partial<Glosario> = {}): Glosario {
  return {
    id: 'glosario-1',
    companyId: 'company-1',
    titulo: 'Deducible',
    descripcion: 'Cantidad que el asegurado paga de su bolsillo antes de la cobertura.',
    active: true,
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2026-08-24'),
    updatedAt: new Date('2026-08-24'),
    ...overrides,
  }
}

function createMocks() {
  const repo: Mocked<GlosarioRepository> = {
    findAll: mock(() => Promise.resolve(Page.empty<Glosario>(defaultPageable))),
    findById: mock(() => Promise.resolve(null)),
    findByTituloAndCompany: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(createMockGlosario())),
    update: mock(() => Promise.resolve(createMockGlosario())),
    softDelete: mock(() => Promise.resolve()),
  }
  return { repo }
}

const baseCreateInput = {
  companyId: 'company-1',
  titulo: 'Deducible',
  descripcion: 'Cantidad que el asegurado paga de su bolsillo antes de la cobertura.',
}

describe('GlosarioService', () => {
  let service: GlosarioService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new GlosarioService(mocks.repo)
  })

  describe('list', () => {
    it('should forward pageable and filters to the repository', async () => {
      const filters = { companyId: 'company-1', titulo: 'deduc' }

      await service.list(defaultPageable, filters)

      expect(mocks.repo.findAll).toHaveBeenCalledWith(defaultPageable, filters)
    })
  })

  describe('create', () => {
    it('should create the term for the given company', async () => {
      await service.create(baseCreateInput)

      expect(mocks.repo.create).toHaveBeenCalledWith(baseCreateInput)
    })

    // RF-GLO-02: UNIQUE (empresaId, titulo)
    it('should reject a titulo already used in the same company', async () => {
      mocks.repo.findByTituloAndCompany.mockResolvedValue(createMockGlosario())

      await expect(service.create(baseCreateInput)).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should check uniqueness scoped to the company, not globally', async () => {
      await service.create(baseCreateInput)

      expect(mocks.repo.findByTituloAndCompany).toHaveBeenCalledWith('Deducible', 'company-1')
    })
  })

  describe('getById', () => {
    it('should throw NotFoundError when the term does not exist', async () => {
      await expect(service.getById('glosario-1', 'company-1')).rejects.toThrow(NotFoundError)
    })

    it('should scope the lookup by company', async () => {
      mocks.repo.findById.mockResolvedValue(createMockGlosario())

      await service.getById('glosario-1', 'company-1')

      expect(mocks.repo.findById).toHaveBeenCalledWith('glosario-1', 'company-1')
    })
  })

  describe('update', () => {
    it('should update titulo and descripcion', async () => {
      mocks.repo.findById.mockResolvedValue(createMockGlosario())

      await service.update('glosario-1', 'company-1', { descripcion: 'Nueva definicion' })

      expect(mocks.repo.update).toHaveBeenCalledWith('glosario-1', {
        descripcion: 'Nueva definicion',
      })
    })

    it('should not update a term from another company', async () => {
      await expect(service.update('glosario-1', 'other-company', { titulo: 'X' })).rejects.toThrow(
        NotFoundError,
      )
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })

    it('should reject renaming onto another existing titulo', async () => {
      mocks.repo.findById.mockResolvedValue(createMockGlosario())
      mocks.repo.findByTituloAndCompany.mockResolvedValue(createMockGlosario({ id: 'glosario-2' }))

      await expect(service.update('glosario-1', 'company-1', { titulo: 'Prima' })).rejects.toThrow(
        ValidationError,
      )
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })

    it('should allow keeping its own titulo untouched', async () => {
      mocks.repo.findById.mockResolvedValue(createMockGlosario())
      mocks.repo.findByTituloAndCompany.mockResolvedValue(createMockGlosario())

      await service.update('glosario-1', 'company-1', { titulo: 'Deducible' })

      expect(mocks.repo.update).toHaveBeenCalledTimes(1)
    })

    it('should not check uniqueness when titulo is not being changed', async () => {
      mocks.repo.findById.mockResolvedValue(createMockGlosario())

      await service.update('glosario-1', 'company-1', { descripcion: 'Otra' })

      expect(mocks.repo.findByTituloAndCompany).not.toHaveBeenCalled()
    })
  })

  describe('softDelete', () => {
    it('should soft-delete an existing term', async () => {
      mocks.repo.findById.mockResolvedValue(createMockGlosario())

      await service.softDelete('glosario-1', 'company-1')

      expect(mocks.repo.softDelete).toHaveBeenCalledWith('glosario-1')
    })

    it('should not soft-delete a term from another company', async () => {
      await expect(service.softDelete('glosario-1', 'other-company')).rejects.toThrow(NotFoundError)
      expect(mocks.repo.softDelete).not.toHaveBeenCalled()
    })
  })
})
