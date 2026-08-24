import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { HitoStatus, ResourceStatus, UserRole } from '@gen/enums'
import { calcularSeveridad, HitoService } from '@/modules/hito-siniestro/application/service'
import type { AlertaRepository, HitoAlerta } from '@/modules/hito-siniestro/domain/alertas'
import type { AsignadoUserProvider } from '@/modules/hito-siniestro/domain/asignado-user-provider'
import type {
  AsignadoBasicInfo,
  HitoSiniestroWithDetails,
  SiniestroBasicInfo,
} from '@/modules/hito-siniestro/domain/entities'
import type { HitoRepository } from '@/modules/hito-siniestro/domain/repository'
import type { SiniestroProvider } from '@/modules/hito-siniestro/domain/siniestro-provider'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

const defaultPageable = new Pageable(1, 20)
const MS_POR_DIA = 24 * 60 * 60 * 1000

const siniestroStub: SiniestroBasicInfo = {
  id: 'siniestro-1',
  companyId: 'company-1',
  clienteUserId: 'user-cliente-1',
}

const asignadoStub: AsignadoBasicInfo = {
  id: 'user-agent-1',
  companyId: 'company-1',
  firstName: 'Age',
  lastName: 'Nte',
  email: 'agente@example.com',
  role: UserRole.AGENT,
}

function enDias(dias: number): Date {
  return new Date(Date.now() + dias * MS_POR_DIA)
}

function createMockHito(
  overrides: Partial<HitoSiniestroWithDetails> = {},
): HitoSiniestroWithDetails {
  return {
    id: 'hito-1',
    siniestroId: 'siniestro-1',
    tarea: 'Entregar reporte',
    descripcion: null,
    fechaLimite: enDias(5),
    alerta: true,
    hitoStatus: HitoStatus.PENDIENTE,
    asignadoAUserId: null,
    active: true,
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2026-08-24'),
    updatedAt: new Date('2026-08-24'),
    asignadoA: null,
    ...overrides,
  }
}

function createMocks() {
  const repo: Mocked<HitoRepository> = {
    findAllBySiniestro: mock(() =>
      Promise.resolve(Page.empty<HitoSiniestroWithDetails>(defaultPageable)),
    ),
    findByIdForSiniestro: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(createMockHito())),
    update: mock(() => Promise.resolve(createMockHito())),
    softDelete: mock(() => Promise.resolve()),
  }
  const alertaRepo: Mocked<AlertaRepository> = {
    findAlertas: mock(() => Promise.resolve(Page.empty<HitoAlerta>(defaultPageable))),
  }
  const siniestroProvider: Mocked<SiniestroProvider> = {
    findActiveByIdForCompany: mock(() => Promise.resolve(siniestroStub)),
  }
  const asignadoProvider: Mocked<AsignadoUserProvider> = {
    findAssignableForCompany: mock(() => Promise.resolve(asignadoStub)),
  }
  return { repo, alertaRepo, siniestroProvider, asignadoProvider }
}

const ownerScope = { siniestroId: 'siniestro-1', companyId: 'company-1' }
const clientScope = { ...ownerScope, clienteUserId: 'user-cliente-1' }

describe('HitoService', () => {
  let service: HitoService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new HitoService(
      mocks.repo,
      mocks.alertaRepo,
      mocks.siniestroProvider,
      mocks.asignadoProvider,
    )
  })

  describe('multi-tenant scope', () => {
    it('should throw NotFoundError when the siniestro is not in the company', async () => {
      mocks.siniestroProvider.findActiveByIdForCompany.mockResolvedValue(null)

      await expect(service.list(ownerScope, defaultPageable, {})).rejects.toThrow(NotFoundError)
      expect(mocks.repo.findAllBySiniestro).not.toHaveBeenCalled()
    })

    it('should hide the siniestro from a CLIENT who does not own it', async () => {
      await expect(
        service.list({ ...clientScope, clienteUserId: 'otro' }, defaultPageable, {}),
      ).rejects.toThrow(NotFoundError)
    })

    it('should let a CLIENT list milestones of their own siniestro', async () => {
      await service.list(clientScope, defaultPageable, {})

      expect(mocks.repo.findAllBySiniestro).toHaveBeenCalledTimes(1)
    })
  })

  describe('create', () => {
    it('should create the milestone for the scoped siniestro', async () => {
      await service.create(ownerScope, { tarea: 'Entregar reporte', fechaLimite: enDias(5) })

      expect(mocks.repo.create.mock.calls[0]?.[0]).toMatchObject({
        siniestroId: 'siniestro-1',
        tarea: 'Entregar reporte',
      })
    })

    it('should reject a fechaLimite already in the past', async () => {
      await expect(
        service.create(ownerScope, { tarea: 'Tarde', fechaLimite: enDias(-1) }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should reject an assignee outside the company or with the wrong role', async () => {
      mocks.asignadoProvider.findAssignableForCompany.mockResolvedValue(null)

      await expect(
        service.create(ownerScope, {
          tarea: 'X',
          fechaLimite: enDias(5),
          asignadoAUserId: 'user-cliente-1',
        }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should validate the assignee against the scoped company', async () => {
      await service.create(ownerScope, {
        tarea: 'X',
        fechaLimite: enDias(5),
        asignadoAUserId: 'user-agent-1',
      })

      expect(mocks.asignadoProvider.findAssignableForCompany).toHaveBeenCalledWith(
        'user-agent-1',
        'company-1',
      )
    })

    it('should not check the assignee when none is given', async () => {
      await service.create(ownerScope, { tarea: 'X', fechaLimite: enDias(5) })

      expect(mocks.asignadoProvider.findAssignableForCompany).not.toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should throw NotFoundError when the milestone is not in the siniestro', async () => {
      await expect(service.getById('hito-1', ownerScope)).rejects.toThrow(NotFoundError)
    })

    it('should scope the lookup by siniestro', async () => {
      mocks.repo.findByIdForSiniestro.mockResolvedValue(createMockHito())

      await service.getById('hito-1', ownerScope)

      expect(mocks.repo.findByIdForSiniestro).toHaveBeenCalledWith('hito-1', 'siniestro-1')
    })
  })

  describe('update', () => {
    it('should reject an invalid assignee', async () => {
      mocks.repo.findByIdForSiniestro.mockResolvedValue(createMockHito())
      mocks.asignadoProvider.findAssignableForCompany.mockResolvedValue(null)

      await expect(
        service.update('hito-1', ownerScope, { asignadoAUserId: 'ajeno' }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })

    it('should allow unassigning with null', async () => {
      mocks.repo.findByIdForSiniestro.mockResolvedValue(createMockHito())

      await service.update('hito-1', ownerScope, { asignadoAUserId: null })

      expect(mocks.repo.update).toHaveBeenCalledWith('hito-1', { asignadoAUserId: null })
      expect(mocks.asignadoProvider.findAssignableForCompany).not.toHaveBeenCalled()
    })

    it('should not update a milestone from another siniestro', async () => {
      await expect(service.update('hito-1', ownerScope, { tarea: 'X' })).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('softDelete', () => {
    it('should soft-delete an existing milestone', async () => {
      mocks.repo.findByIdForSiniestro.mockResolvedValue(createMockHito())

      await service.softDelete('hito-1', ownerScope)

      expect(mocks.repo.softDelete).toHaveBeenCalledWith('hito-1')
    })

    it('should not soft-delete one that is not in the siniestro', async () => {
      await expect(service.softDelete('hito-1', ownerScope)).rejects.toThrow(NotFoundError)
      expect(mocks.repo.softDelete).not.toHaveBeenCalled()
    })
  })

  describe('listAlertas', () => {
    it('should translate diasHorizonte into an upper bound date', async () => {
      await service.listAlertas(defaultPageable, { companyId: 'company-1', diasHorizonte: 7 })

      const filtros = mocks.alertaRepo.findAlertas.mock.calls[0]?.[1]
      expect(filtros?.companyId).toBe('company-1')
      expect(filtros?.hasta.getTime()).toBeGreaterThan(Date.now())
    })

    it('should forward the optional filters', async () => {
      await service.listAlertas(defaultPageable, {
        companyId: 'company-1',
        diasHorizonte: 3,
        severidad: 'VENCIDO',
        asignadoAUserId: 'user-agent-1',
        siniestroId: 'siniestro-1',
      })

      expect(mocks.alertaRepo.findAlertas.mock.calls[0]?.[1]).toMatchObject({
        severidad: 'VENCIDO',
        asignadoAUserId: 'user-agent-1',
        siniestroId: 'siniestro-1',
      })
    })
  })
})

describe('calcularSeveridad', () => {
  const hoy = new Date('2026-08-24T10:00:00.000Z')

  it('should report VENCIDO for a past deadline', () => {
    expect(calcularSeveridad(new Date('2026-08-22T00:00:00.000Z'), hoy)).toEqual({
      severidad: 'VENCIDO',
      diasRestantes: -2,
    })
  })

  it('should report HOY for the same day regardless of the time', () => {
    expect(calcularSeveridad(new Date('2026-08-24T23:00:00.000Z'), hoy)).toEqual({
      severidad: 'HOY',
      diasRestantes: 0,
    })
  })

  it('should report PROXIMO for a future deadline', () => {
    expect(calcularSeveridad(new Date('2026-08-27T00:00:00.000Z'), hoy)).toEqual({
      severidad: 'PROXIMO',
      diasRestantes: 3,
    })
  })
})
