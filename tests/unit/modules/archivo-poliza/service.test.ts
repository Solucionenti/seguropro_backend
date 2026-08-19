import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ResourceStatus } from '@gen/enums'
import { ArchivoPolizaService } from '@/modules/archivo-poliza/application/service'
import type { ArchivoPoliza, PolizaBasicInfo } from '@/modules/archivo-poliza/domain/entities'
import type { PlanStorageProvider } from '@/modules/archivo-poliza/domain/plan-storage-provider'
import type { PolizaProvider } from '@/modules/archivo-poliza/domain/poliza-provider'
import type { ArchivoPolizaRepository } from '@/modules/archivo-poliza/domain/repository'
import type { FileStorage } from '@/shared/domain/file-storage'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, Pageable } from '@/shared/domain/pagination'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

const defaultPageable = new Pageable(1, 20)
const MB = 1024 * 1024

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
    storageKey: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pdf',
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
    sumBytesByCompany: mock(() => Promise.resolve(0)),
    create: mock(() => Promise.resolve(createMockArchivo())),
    update: mock(() => Promise.resolve(createMockArchivo())),
    softDelete: mock(() => Promise.resolve()),
  }
  const polizaProvider: Mocked<PolizaProvider> = {
    findActiveByIdForCompany: mock(() => Promise.resolve(polizaStub)),
  }
  const storage: Mocked<FileStorage> = {
    upload: mock(() =>
      Promise.resolve({ storageKey: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pdf', sizeBytes: 1024 }),
    ),
    signedUrl: mock(() =>
      Promise.resolve('https://api.test/api/v1/files/key?expires=1&signature=x'),
    ),
    delete: mock(() => Promise.resolve()),
  }
  const planStorageProvider: Mocked<PlanStorageProvider> = {
    findLimitGBForCompany: mock(() => Promise.resolve(null)),
  }
  return { repo, polizaProvider, storage, planStorageProvider }
}

const ownerScope = { polizaId: 'poliza-1', companyId: 'company-1' }
const clientScope = { ...ownerScope, clienteUserId: 'user-cliente-1' }

function pdf(sizeBytes = 1024) {
  return {
    body: new ArrayBuffer(sizeBytes),
    originalName: 'caratula.pdf',
    mimeType: 'application/pdf',
  }
}

describe('ArchivoPolizaService', () => {
  let service: ArchivoPolizaService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new ArchivoPolizaService(
      mocks.repo,
      mocks.polizaProvider,
      mocks.storage,
      mocks.planStorageProvider,
      { maxFileSizeBytes: 10 * MB },
    )
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

  describe('upload', () => {
    it('should send the binary to the storage and persist only the key', async () => {
      await service.upload(ownerScope, pdf())

      expect(mocks.storage.upload).toHaveBeenCalledTimes(1)
      expect(mocks.repo.create).toHaveBeenCalledWith({
        polizaId: 'poliza-1',
        nombre: 'caratula.pdf',
        mimeType: 'application/pdf',
        storageKey: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pdf',
        tamanoBytes: 1024,
      })
    })

    it('should never expose the storageKey, only a signed url', async () => {
      const archivo = await service.upload(ownerScope, pdf())

      expect(archivo).not.toHaveProperty('storageKey')
      expect(archivo.url).toContain('signature=')
    })

    it('should prefer an explicit nombre over the original file name', async () => {
      await service.upload(ownerScope, { ...pdf(), nombre: 'endoso 2026' })

      expect(mocks.repo.create.mock.calls[0]?.[0]).toMatchObject({ nombre: 'endoso 2026' })
    })

    it('should reject a mimeType outside the allow-list', async () => {
      await expect(
        service.upload(ownerScope, { ...pdf(), mimeType: 'application/x-msdownload' }),
      ).rejects.toThrow(ValidationError)
      expect(mocks.storage.upload).not.toHaveBeenCalled()
    })

    it('should reject an empty file', async () => {
      await expect(service.upload(ownerScope, pdf(0))).rejects.toThrow(ValidationError)
      expect(mocks.storage.upload).not.toHaveBeenCalled()
    })

    it('should reject a file over the size cap', async () => {
      await expect(service.upload(ownerScope, pdf(11 * MB))).rejects.toThrow(ValidationError)
      expect(mocks.storage.upload).not.toHaveBeenCalled()
    })

    it('should reject when the plan storage limit would be exceeded', async () => {
      mocks.planStorageProvider.findLimitGBForCompany.mockResolvedValue(1)
      mocks.repo.sumBytesByCompany.mockResolvedValue(1024 ** 3)

      await expect(service.upload(ownerScope, pdf())).rejects.toThrow(ValidationError)
      expect(mocks.storage.upload).not.toHaveBeenCalled()
    })

    it('should allow the upload when the plan sets no storage limit', async () => {
      mocks.planStorageProvider.findLimitGBForCompany.mockResolvedValue(null)
      mocks.repo.sumBytesByCompany.mockResolvedValue(50 * 1024 ** 3)

      await service.upload(ownerScope, pdf())

      expect(mocks.storage.upload).toHaveBeenCalledTimes(1)
      expect(mocks.repo.sumBytesByCompany).not.toHaveBeenCalled()
    })

    it('should not upload to a poliza outside the company', async () => {
      mocks.polizaProvider.findActiveByIdForCompany.mockResolvedValue(null)

      await expect(service.upload(ownerScope, pdf())).rejects.toThrow(NotFoundError)
      expect(mocks.storage.upload).not.toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should throw NotFoundError when the file does not belong to the poliza', async () => {
      await expect(service.getById('archivo-1', ownerScope)).rejects.toThrow(NotFoundError)
    })

    it('should return the file with a signed url', async () => {
      mocks.repo.findByIdForPoliza.mockResolvedValue(createMockArchivo())

      const archivo = await service.getById('archivo-1', ownerScope)

      expect(archivo.id).toBe('archivo-1')
      expect(archivo.url).toContain('signature=')
      expect(mocks.repo.findByIdForPoliza).toHaveBeenCalledWith('archivo-1', 'poliza-1')
    })
  })

  describe('rename', () => {
    it('should only update the nombre', async () => {
      mocks.repo.findByIdForPoliza.mockResolvedValue(createMockArchivo())

      await service.rename('archivo-1', ownerScope, 'endoso.pdf')

      expect(mocks.repo.update).toHaveBeenCalledWith('archivo-1', { nombre: 'endoso.pdf' })
    })

    it('should not rename a file that is not in the poliza', async () => {
      await expect(service.rename('archivo-1', ownerScope, 'x.pdf')).rejects.toThrow(NotFoundError)
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })
  })

  describe('softDelete', () => {
    it('should soft-delete the row and leave the binary in the storage', async () => {
      mocks.repo.findByIdForPoliza.mockResolvedValue(createMockArchivo())

      await service.softDelete('archivo-1', ownerScope)

      expect(mocks.repo.softDelete).toHaveBeenCalledWith('archivo-1')
      expect(mocks.storage.delete).not.toHaveBeenCalled()
    })

    it('should not soft-delete a file that is not in the poliza', async () => {
      await expect(service.softDelete('archivo-1', ownerScope)).rejects.toThrow(NotFoundError)
      expect(mocks.repo.softDelete).not.toHaveBeenCalled()
    })
  })
})
