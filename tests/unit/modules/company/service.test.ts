import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ResourceStatus, TipoPersona } from '@gen/enums'
import { CompanyService } from '@/modules/company/application/service'
import type { Company } from '@/modules/company/domain/entities'
import type { CompanyRepository } from '@/modules/company/domain/repository'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, Pageable } from '@/shared/domain/pagination'
import type { Mocked } from '../../../utils/mocked'

const defaultPageable = new Pageable(1, 20)

function createMockCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: 'company-1',
    razonSocial: 'Segur SA de CV',
    nombreComercial: 'Segur',
    rfc: 'SEG010101ABC',
    tipoPersona: TipoPersona.MORAL,
    emailContacto: 'contacto@segur.mx',
    telefonoContacto: '5555555555',
    pais: 'MX',
    estado: 'CDMX',
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

function createMocks() {
  const repo: Mocked<CompanyRepository> = {
    findAll: mock(() => Promise.resolve(Page.empty<Company>(defaultPageable))),
    findById: mock(() => Promise.resolve(null)),
  }
  return { repo }
}

describe('CompanyService', () => {
  let service: CompanyService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new CompanyService(mocks.repo)
  })

  describe('list', () => {
    it('should forward pageable and filters to the repository', async () => {
      const filters = { nombre: 'Segur', tipoPersona: TipoPersona.MORAL }

      await service.list(defaultPageable, filters)

      expect(mocks.repo.findAll).toHaveBeenCalledWith(defaultPageable, filters)
    })
  })

  describe('getById', () => {
    it('should throw NotFoundError when the company does not exist', async () => {
      await expect(service.getById('company-404')).rejects.toThrow(NotFoundError)
    })

    it('should return the company when it exists', async () => {
      mocks.repo.findById.mockResolvedValue(createMockCompany())

      const company = await service.getById('company-1')

      expect(company.nombreComercial).toBe('Segur')
    })
  })
})
