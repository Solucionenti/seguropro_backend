import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ResourceStatus, SiniestroStatus } from '@gen/enums'
import { SiniestroService } from '@/modules/siniestro/application/service'
import type { PolizaBasicInfo, SiniestroWithDetails } from '@/modules/siniestro/domain/entities'
import type { PolizaProvider } from '@/modules/siniestro/domain/poliza-provider'
import type { SiniestroRepository } from '@/modules/siniestro/domain/repository'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

const defaultPageable = new Pageable(1, 20)

const polizaStub: PolizaBasicInfo = {
  id: 'poliza-1',
  companyId: 'company-1',
  clienteUserId: 'user-cliente-1',
  numeroPoliza: 'POL-001',
  fechaInicio: new Date('2026-01-01'),
  fechaVencimiento: new Date('2026-12-31'),
}

const userStub = {
  id: 'user-cliente-1',
  companyId: 'company-1',
  firstName: 'Ana',
  lastName: 'Lopez',
  email: 'ana@example.com',
}

function createMockSiniestro(overrides: Partial<SiniestroWithDetails> = {}): SiniestroWithDetails {
  return {
    id: 'siniestro-1',
    companyId: 'company-1',
    polizaId: 'poliza-1',
    clienteUserId: 'user-cliente-1',
    creadoPorUserId: 'user-agent-1',
    tipoSiniestro: 'Colision',
    fechaEvento: new Date('2026-06-15'),
    descripcion: null,
    ajustador: null,
    montoEstimado: null,
    montoPagado: null,
    siniestroStatus: SiniestroStatus.REPORTADO,
    active: true,
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2026-06-16'),
    updatedAt: new Date('2026-06-16'),
    poliza: { id: 'poliza-1', companyId: 'company-1', numeroPoliza: 'POL-001' },
    cliente: userStub,
    creadoPor: { ...userStub, id: 'user-agent-1', email: 'agente@example.com' },
    ...overrides,
  }
}

function createMocks() {
  const repo: Mocked<SiniestroRepository> = {
    findAll: mock(() => Promise.resolve(Page.empty<SiniestroWithDetails>(defaultPageable))),
    findById: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(createMockSiniestro())),
    update: mock(() => Promise.resolve(createMockSiniestro())),
    softDelete: mock(() => Promise.resolve()),
  }
  const polizaProvider: Mocked<PolizaProvider> = {
    findActiveByIdForCompany: mock(() => Promise.resolve(polizaStub)),
  }
  return { repo, polizaProvider }
}

const baseCreateInput = {
  companyId: 'company-1',
  polizaId: 'poliza-1',
  creadoPorUserId: 'user-agent-1',
  fechaEvento: new Date('2026-06-15'),
}

describe('SiniestroService', () => {
  let service: SiniestroService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new SiniestroService(mocks.repo, mocks.polizaProvider)
  })

  describe('create', () => {
    it('should derive clienteUserId from the poliza instead of trusting the caller', async () => {
      await service.create(baseCreateInput)

      expect(mocks.repo.create).toHaveBeenCalledTimes(1)
      expect(mocks.repo.create.mock.calls[0]?.[0]).toMatchObject({
        clienteUserId: polizaStub.clienteUserId,
        polizaId: 'poliza-1',
        creadoPorUserId: 'user-agent-1',
      })
    })

    it('should reject when the poliza does not belong to the company', async () => {
      mocks.polizaProvider.findActiveByIdForCompany.mockResolvedValue(null)

      await expect(service.create(baseCreateInput)).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should reject a fechaEvento before the poliza coverage starts', async () => {
      await expect(
        service.create({ ...baseCreateInput, fechaEvento: new Date('2025-12-31') }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should reject a fechaEvento after the poliza coverage ends', async () => {
      mocks.polizaProvider.findActiveByIdForCompany.mockResolvedValue({
        ...polizaStub,
        fechaInicio: new Date('2020-01-01'),
        fechaVencimiento: new Date('2020-12-31'),
      })

      await expect(
        service.create({ ...baseCreateInput, fechaEvento: new Date('2021-06-15') }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should reject a fechaEvento in the future', async () => {
      const future = new Date(Date.now() + 86_400_000)
      mocks.polizaProvider.findActiveByIdForCompany.mockResolvedValue({
        ...polizaStub,
        fechaInicio: new Date('2020-01-01'),
        fechaVencimiento: new Date(Date.now() + 10 * 86_400_000),
      })

      await expect(service.create({ ...baseCreateInput, fechaEvento: future })).rejects.toThrow(
        ValidationError,
      )
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should reject a negative montoEstimado', async () => {
      await expect(service.create({ ...baseCreateInput, montoEstimado: -1 })).rejects.toThrow(
        ValidationError,
      )
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should throw NotFoundError when the siniestro does not exist', async () => {
      await expect(service.getById('siniestro-1', 'company-1')).rejects.toThrow(NotFoundError)
    })

    it('should forward clienteUserId so a CLIENT only reaches their own siniestros', async () => {
      mocks.repo.findById.mockResolvedValue(createMockSiniestro())

      await service.getById('siniestro-1', 'company-1', 'user-cliente-1')

      expect(mocks.repo.findById).toHaveBeenCalledWith('siniestro-1', 'company-1', 'user-cliente-1')
    })
  })

  describe('update', () => {
    it('should reject a negative montoPagado', async () => {
      mocks.repo.findById.mockResolvedValue(createMockSiniestro())

      await expect(service.update('siniestro-1', 'company-1', { montoPagado: -5 })).rejects.toThrow(
        ValidationError,
      )
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })

    it('should not update a siniestro from another company', async () => {
      await expect(
        service.update('siniestro-1', 'other-company', { ajustador: 'Juan' }),
      ).rejects.toThrow(NotFoundError)
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })
  })

  describe('softDelete', () => {
    it('should soft-delete an existing siniestro', async () => {
      mocks.repo.findById.mockResolvedValue(createMockSiniestro())

      await service.softDelete('siniestro-1', 'company-1')

      expect(mocks.repo.softDelete).toHaveBeenCalledWith('siniestro-1')
    })

    it('should not soft-delete a siniestro from another company', async () => {
      await expect(service.softDelete('siniestro-1', 'other-company')).rejects.toThrow(
        NotFoundError,
      )
      expect(mocks.repo.softDelete).not.toHaveBeenCalled()
    })
  })
})
