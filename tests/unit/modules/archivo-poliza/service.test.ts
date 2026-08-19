import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ResourceStatus } from '@gen/enums'
import { ArchivoPolizaService } from '@/modules/archivo-poliza/application/service'
import type { ArchivoPoliza, PolizaBasicInfo } from '@/modules/archivo-poliza/domain/entities'
import type { PolizaProvider } from '@/modules/archivo-poliza/domain/poliza-provider'
import type { ArchivoPolizaRepository } from '@/modules/archivo-poliza/domain/repository'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

const defaultPageable = new Pageable(1, 20)

const polizaStub: PolizaBasicInfo = {
  id: 'poliza-1',
  companyId: 'company-1',
  clienteUserId: 'user-cliente-1',
}

function createMockArchivo(overrides: Partial<ArchivoPoliza> = {}): ArchivoPoliza {
  return {
    id: 'archivo-1',
    polizaId: 'poliza-1',
    nombre: 'caratula.pdf',
    mimeType: 'application/pdf',
    url: 'https://storage.example.com/caratula.pdf',
    tamanoBytes: 1024,
    active: true,
    status: ResourceStatus.ACTIVE,
    createdAt: new Date('2026-06-16'),
    updatedAt: new Date('2026-06-16'),
    ...overrides,
  }
}

function createMocks() {
  const repo: Mocked<ArchivoPolizaRepository> = {
    findAllByPoliza: mock(() => Promise.resolve(Page.empty<ArchivoPoliza>(defaultPageable))),
    findByIdForPoliza: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(createMockArchivo())),
    update: mock(() => Promise.resolve(createMockArchivo())),
    softDelete: mock(() => Promise.resolve()),
  }
  const polizaProvider: Mocked<PolizaProvider> = {
    findActiveByIdForCompany: mock(() => Promise.resolve(polizaStub)),
  }
  return { repo, polizaProvider }
}

const ownerScope = { polizaId: 'poliza-1', companyId: 'company-1' }
const clientScope = { ...ownerScope, clienteUserId: 'user-cliente-1' }

const baseCreateInput = {
  nombre: 'caratula.pdf',
  mimeType: 'application/pdf',
  url: 'https://storage.example.com/caratula.pdf',
}

describe('ArchivoPolizaService', () => {
  let service: ArchivoPolizaService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new ArchivoPolizaService(mocks.repo, mocks.polizaProvider)
  })

  describe('multi-tenant scope', () => {
    it('should throw NotFoundError when the poliza is not in the company', async () => {
      mocks.polizaProvider.findActiveByIdForCompany.mockResolvedValue(null)

      await expect(service.list(ownerScope, defaultPageable)).rejects.toThrow(NotFoundError)
      expect(mocks.repo.findAllByPoliza).not.toHaveBeenCalled()
    })

    it('should hide the poliza from a CLIENT who does not own it', async () => {
      await expect(
        service.list({ ...clientScope, clienteUserId: 'otro-cliente' }, defaultPageable),
      ).rejects.toThrow(NotFoundError)
      expect(mocks.repo.findAllByPoliza).not.toHaveBeenCalled()
    })

    it('should let a CLIENT list files of their own poliza', async () => {
      await service.list(clientScope, defaultPageable)

      expect(mocks.repo.findAllByPoliza).toHaveBeenCalledWith('poliza-1', defaultPageable)
    })
  })

  describe('create', () => {
    it('should store the metadata scoped to the poliza', async () => {
      await service.create(ownerScope, { ...baseCreateInput, tamanoBytes: 2048 })

      expect(mocks.repo.create).toHaveBeenCalledWith({
        polizaId: 'poliza-1',
        nombre: 'caratula.pdf',
        mimeType: 'application/pdf',
        url: 'https://storage.example.com/caratula.pdf',
        tamanoBytes: 2048,
      })
    })

    it('should reject a mimeType outside the allow-list', async () => {
      await expect(
        service.create(ownerScope, { ...baseCreateInput, mimeType: 'application/x-msdownload' }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })

    it('should reject a negative tamanoBytes', async () => {
      await expect(
        service.create(ownerScope, { ...baseCreateInput, tamanoBytes: -1 }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.create).not.toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should throw NotFoundError when the file does not belong to the poliza', async () => {
      await expect(service.getById('archivo-1', ownerScope)).rejects.toThrow(NotFoundError)
    })

    it('should return the file when it belongs to the poliza', async () => {
      mocks.repo.findByIdForPoliza.mockResolvedValue(createMockArchivo())

      const archivo = await service.getById('archivo-1', ownerScope)

      expect(archivo.id).toBe('archivo-1')
      expect(mocks.repo.findByIdForPoliza).toHaveBeenCalledWith('archivo-1', 'poliza-1')
    })
  })

  describe('update', () => {
    it('should reject an invalid mimeType', async () => {
      mocks.repo.findByIdForPoliza.mockResolvedValue(createMockArchivo())

      await expect(
        service.update('archivo-1', ownerScope, { mimeType: 'text/x-script' }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })

    it('should update allowed metadata', async () => {
      mocks.repo.findByIdForPoliza.mockResolvedValue(createMockArchivo())

      await service.update('archivo-1', ownerScope, { nombre: 'endoso.pdf' })

      expect(mocks.repo.update).toHaveBeenCalledWith('archivo-1', { nombre: 'endoso.pdf' })
    })
  })

  describe('softDelete', () => {
    it('should soft-delete an existing file', async () => {
      mocks.repo.findByIdForPoliza.mockResolvedValue(createMockArchivo())

      await service.softDelete('archivo-1', ownerScope)

      expect(mocks.repo.softDelete).toHaveBeenCalledWith('archivo-1')
    })

    it('should not soft-delete a file that is not in the poliza', async () => {
      await expect(service.softDelete('archivo-1', ownerScope)).rejects.toThrow(NotFoundError)
      expect(mocks.repo.softDelete).not.toHaveBeenCalled()
    })
  })
})
