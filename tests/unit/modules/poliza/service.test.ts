import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { PolizaStatus, ResourceStatus } from '@gen/enums'
import { PolizaService } from '@/modules/poliza/application/service'
import type { AseguradoraProvider } from '@/modules/poliza/domain/aseguradora-provider'
import type { ClienteUserProvider } from '@/modules/poliza/domain/cliente-user-provider'
import type {
  AseguradoraBasicInfo,
  ClienteBasicInfo,
  PolizaWithDetails,
  RamoBasicInfo,
} from '@/modules/poliza/domain/entities'
import type { RamoProvider } from '@/modules/poliza/domain/ramo-provider'
import type { PolizaRepository } from '@/modules/poliza/domain/repository'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

const defaultPageable = new Pageable(1, 20)

const aseguradoraStub: AseguradoraBasicInfo = {
  id: 'aseg-1',
  companyId: 'company-1',
  nombre: 'GNP',
}
const ramoStub: RamoBasicInfo = {
  id: 'ramo-1',
  companyId: 'company-1',
  nombre: 'Autos',
}
const clienteStub: ClienteBasicInfo = {
  id: 'user-cliente-1',
  companyId: 'company-1',
  firstName: 'Ana',
  lastName: 'Lopez',
  email: 'ana@example.com',
}

function createMockPoliza(overrides: Partial<PolizaWithDetails> = {}): PolizaWithDetails {
  return {
    id: 'poliza-1',
    companyId: 'company-1',
    aseguradoraId: 'aseg-1',
    ramoId: 'ramo-1',
    clienteUserId: 'user-cliente-1',
    numeroPoliza: 'POL-001',
    fechaInicio: new Date('2026-01-01'),
    fechaVencimiento: new Date('2027-01-01'),
    primaNeta: 1000,
    primaTotal: 1160,
    polizaStatus: PolizaStatus.VIGENTE,
    active: true,
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    aseguradora: aseguradoraStub,
    ramo: ramoStub,
    cliente: clienteStub,
    ...overrides,
  }
}

function createMocks() {
  const repo: Mocked<PolizaRepository> = {
    findAll: mock(() => Promise.resolve(Page.empty<PolizaWithDetails>(defaultPageable))),
    findById: mock(() => Promise.resolve(null)),
    findByNumeroAndCompany: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(createMockPoliza())),
    update: mock(() => Promise.resolve(createMockPoliza())),
    softDelete: mock(() => Promise.resolve()),
  }
  const aseguradoraProvider: Mocked<AseguradoraProvider> = {
    findActiveByIdForCompany: mock(() => Promise.resolve(aseguradoraStub)),
  }
  const ramoProvider: Mocked<RamoProvider> = {
    findActiveByIdForCompany: mock(() => Promise.resolve(ramoStub)),
  }
  const clienteProvider: Mocked<ClienteUserProvider> = {
    findActiveClientForCompany: mock(() => Promise.resolve(clienteStub)),
  }
  return { repo, aseguradoraProvider, ramoProvider, clienteProvider }
}

const baseCreateInput = {
  companyId: 'company-1',
  aseguradoraId: 'aseg-1',
  ramoId: 'ramo-1',
  clienteUserId: 'user-cliente-1',
  numeroPoliza: 'POL-001',
  fechaInicio: new Date('2026-01-01'),
  fechaVencimiento: new Date('2027-01-01'),
  primaNeta: 1000,
  primaTotal: 1160,
}

describe('PolizaService', () => {
  let service: PolizaService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new PolizaService(
      mocks.repo,
      mocks.aseguradoraProvider,
      mocks.ramoProvider,
      mocks.clienteProvider,
    )
  })

  describe('list', () => {
    it('should return paginated results for the company', async () => {
      mocks.repo.findAll.mockResolvedValue(Page.of([createMockPoliza()], 1, defaultPageable))

      const result = await service.list(defaultPageable, { companyId: 'company-1' })

      expect(result.total).toBe(1)
      expect(result.content[0]?.numeroPoliza).toBe('POL-001')
      expect(mocks.repo.findAll).toHaveBeenCalledWith(defaultPageable, { companyId: 'company-1' })
    })

    it('should pass clienteUserId filter when provided (CLIENT scoping)', async () => {
      await service.list(defaultPageable, {
        companyId: 'company-1',
        clienteUserId: 'user-cliente-1',
      })

      expect(mocks.repo.findAll).toHaveBeenCalledWith(defaultPageable, {
        companyId: 'company-1',
        clienteUserId: 'user-cliente-1',
      })
    })
  })

  describe('create', () => {
    it('should create when all FKs resolve and numero is unique', async () => {
      const result = await service.create(baseCreateInput)

      expect(mocks.aseguradoraProvider.findActiveByIdForCompany).toHaveBeenCalledWith(
        'aseg-1',
        'company-1',
      )
      expect(mocks.ramoProvider.findActiveByIdForCompany).toHaveBeenCalledWith(
        'ramo-1',
        'company-1',
      )
      expect(mocks.clienteProvider.findActiveClientForCompany).toHaveBeenCalledWith(
        'user-cliente-1',
        'company-1',
      )
      expect(mocks.repo.findByNumeroAndCompany).toHaveBeenCalledWith('POL-001', 'company-1')
      expect(mocks.repo.create).toHaveBeenCalled()
      expect(result.numeroPoliza).toBe('POL-001')
    })

    it('should reject when fechaVencimiento < fechaInicio', async () => {
      expect(
        service.create({
          ...baseCreateInput,
          fechaInicio: new Date('2026-06-01'),
          fechaVencimiento: new Date('2026-01-01'),
        }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should reject when primaTotal < primaNeta', async () => {
      expect(
        service.create({ ...baseCreateInput, primaNeta: 2000, primaTotal: 1000 }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should reject when aseguradora not in company', async () => {
      mocks.aseguradoraProvider.findActiveByIdForCompany.mockResolvedValue(null)

      expect(service.create(baseCreateInput)).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should reject when ramo not in company', async () => {
      mocks.ramoProvider.findActiveByIdForCompany.mockResolvedValue(null)

      expect(service.create(baseCreateInput)).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should reject when cliente not in company', async () => {
      mocks.clienteProvider.findActiveClientForCompany.mockResolvedValue(null)

      expect(service.create(baseCreateInput)).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should reject duplicate numeroPoliza in same company', async () => {
      mocks.repo.findByNumeroAndCompany.mockResolvedValue(createMockPoliza())

      expect(service.create(baseCreateInput)).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should return the poliza when found', async () => {
      mocks.repo.findById.mockResolvedValue(createMockPoliza())

      const result = await service.getById('poliza-1', 'company-1')

      expect(result.id).toBe('poliza-1')
      expect(mocks.repo.findById).toHaveBeenCalledWith('poliza-1', 'company-1', undefined)
    })

    it('should forward clienteUserId for CLIENT scoping', async () => {
      mocks.repo.findById.mockResolvedValue(createMockPoliza())

      await service.getById('poliza-1', 'company-1', 'user-cliente-1')

      expect(mocks.repo.findById).toHaveBeenCalledWith('poliza-1', 'company-1', 'user-cliente-1')
    })

    it('should throw NotFoundError when missing', async () => {
      expect(service.getById('missing', 'company-1')).rejects.toThrow(NotFoundError)
    })
  })

  describe('update', () => {
    it('should update editable fields successfully', async () => {
      const existing = createMockPoliza()
      mocks.repo.findById.mockResolvedValue(existing)
      mocks.repo.update.mockResolvedValue({ ...existing, primaTotal: 1500 })

      const result = await service.update('poliza-1', 'company-1', { primaTotal: 1500 })

      expect(result.primaTotal).toBe(1500)
      expect(mocks.repo.update).toHaveBeenCalledWith('poliza-1', { primaTotal: 1500 })
    })

    it('should reject when new fechaVencimiento < existing fechaInicio', async () => {
      mocks.repo.findById.mockResolvedValue(createMockPoliza())

      expect(
        service.update('poliza-1', 'company-1', { fechaVencimiento: new Date('2025-01-01') }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })

    it('should reject when resulting primaTotal < primaNeta', async () => {
      mocks.repo.findById.mockResolvedValue(createMockPoliza())

      expect(service.update('poliza-1', 'company-1', { primaTotal: 500 })).rejects.toThrow(
        ValidationError,
      )
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })

    it('should throw NotFoundError when missing', async () => {
      expect(service.update('missing', 'company-1', { primaTotal: 9999 })).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('softDelete', () => {
    it('should soft delete when poliza exists', async () => {
      mocks.repo.findById.mockResolvedValue(createMockPoliza())

      await service.softDelete('poliza-1', 'company-1')

      expect(mocks.repo.softDelete).toHaveBeenCalledWith('poliza-1')
    })

    it('should throw NotFoundError when missing', async () => {
      expect(service.softDelete('missing', 'company-1')).rejects.toThrow(NotFoundError)
      expect(mocks.repo.softDelete).not.toHaveBeenCalled()
    })
  })
})
