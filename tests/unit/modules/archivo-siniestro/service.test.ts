import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ResourceStatus } from '@gen/enums'
import { ArchivoSiniestroService } from '@/modules/archivo-siniestro/application/service'
import type {
  ArchivoSiniestro,
  SiniestroBasicInfo,
} from '@/modules/archivo-siniestro/domain/entities'
import type { ArchivoSiniestroRepository } from '@/modules/archivo-siniestro/domain/repository'
import type { SiniestroProvider } from '@/modules/archivo-siniestro/domain/siniestro-provider'
import type { FileStorage } from '@/shared/domain/file-storage'
import { NotFoundError } from '@/shared/domain/not-found-error'
import { Page, Pageable } from '@/shared/domain/pagination'
import type { StorageQuota } from '@/shared/domain/storage-quota'
import { ValidationError } from '@/shared/domain/validation-error'
import type { Mocked } from '../../../utils/mocked'

const defaultPageable = new Pageable(1, 20)
const MB = 1024 * 1024

const siniestroStub: SiniestroBasicInfo = {
  id: 'siniestro-1',
  companyId: 'company-1',
  clienteUserId: 'user-cliente-1',
}

function createMockArchivo(overrides: Partial<ArchivoSiniestro> = {}): ArchivoSiniestro {
  return {
    id: 'archivo-1',
    siniestroId: 'siniestro-1',
    nombre: 'peritaje.pdf',
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
  const repo: Mocked<ArchivoSiniestroRepository> = {
    findAllBySiniestro: mock(() => Promise.resolve(Page.empty<ArchivoSiniestro>(defaultPageable))),
    findByIdForSiniestro: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(createMockArchivo())),
    update: mock(() => Promise.resolve(createMockArchivo())),
    softDelete: mock(() => Promise.resolve()),
  }
  const siniestroProvider: Mocked<SiniestroProvider> = {
    findActiveByIdForCompany: mock(() => Promise.resolve(siniestroStub)),
  }
  const storage: Mocked<FileStorage> = {
    upload: mock(() =>
      Promise.resolve({ storageKey: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pdf', sizeBytes: 1024 }),
    ),
    signedUrl: mock(() => Promise.resolve('https://r2.test/key?X-Amz-Signature=abc')),
    delete: mock(() => Promise.resolve()),
  }
  const storageQuota: Mocked<StorageQuota> = {
    assertCanStore: mock(() => Promise.resolve()),
  }
  return { repo, siniestroProvider, storage, storageQuota }
}

const ownerScope = { siniestroId: 'siniestro-1', companyId: 'company-1' }
const clientScope = { ...ownerScope, clienteUserId: 'user-cliente-1' }

function pdf(sizeBytes = 1024) {
  return {
    body: new ArrayBuffer(sizeBytes),
    originalName: 'peritaje.pdf',
    mimeType: 'application/pdf',
  }
}

describe('ArchivoSiniestroService', () => {
  let service: ArchivoSiniestroService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new ArchivoSiniestroService(
      mocks.repo,
      mocks.siniestroProvider,
      mocks.storage,
      mocks.storageQuota,
      { maxFileSizeBytes: 10 * MB },
    )
  })

  describe('multi-tenant scope', () => {
    it('should throw NotFoundError when the siniestro is not in the company', async () => {
      mocks.siniestroProvider.findActiveByIdForCompany.mockResolvedValue(null)

      await expect(service.list(ownerScope, defaultPageable)).rejects.toThrow(NotFoundError)
      expect(mocks.repo.findAllBySiniestro).not.toHaveBeenCalled()
    })

    it('should hide the siniestro from a CLIENT who does not own it', async () => {
      await expect(
        service.list({ ...clientScope, clienteUserId: 'otro-cliente' }, defaultPageable),
      ).rejects.toThrow(NotFoundError)
      expect(mocks.repo.findAllBySiniestro).not.toHaveBeenCalled()
    })

    it('should let a CLIENT list files of their own siniestro', async () => {
      await service.list(clientScope, defaultPageable)

      expect(mocks.repo.findAllBySiniestro).toHaveBeenCalledWith('siniestro-1', defaultPageable)
    })
  })

  describe('upload', () => {
    it('should send the binary to the storage and persist only the key', async () => {
      await service.upload(ownerScope, pdf())

      expect(mocks.storage.upload).toHaveBeenCalledTimes(1)
      expect(mocks.repo.create).toHaveBeenCalledWith({
        siniestroId: 'siniestro-1',
        nombre: 'peritaje.pdf',
        mimeType: 'application/pdf',
        storageKey: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pdf',
        tamanoBytes: 1024,
      })
    })

    it('should never expose the storageKey, only a signed url', async () => {
      const archivo = await service.upload(ownerScope, pdf())

      expect(archivo).not.toHaveProperty('storageKey')
      expect(archivo.url).toContain('X-Amz-Signature')
    })

    it('should prefer an explicit nombre over the original file name', async () => {
      await service.upload(ownerScope, { ...pdf(), nombre: 'Dictamen final' })

      expect(mocks.repo.create.mock.calls[0]?.[0]).toMatchObject({ nombre: 'Dictamen final' })
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

    it('should reject when the shared storage quota refuses the upload', async () => {
      mocks.storageQuota.assertCanStore.mockRejectedValue(
        new ValidationError('storage limit exceeded'),
      )

      await expect(service.upload(ownerScope, pdf())).rejects.toThrow(ValidationError)
      expect(mocks.storage.upload).not.toHaveBeenCalled()
    })

    // the plan cap is per company and spans poliza + siniestro files
    it('should check the quota against the company, not the siniestro', async () => {
      await service.upload(ownerScope, pdf(4096))

      expect(mocks.storageQuota.assertCanStore).toHaveBeenCalledWith('company-1', 4096)
    })

    it('should not upload to a siniestro outside the company', async () => {
      mocks.siniestroProvider.findActiveByIdForCompany.mockResolvedValue(null)

      await expect(service.upload(ownerScope, pdf())).rejects.toThrow(NotFoundError)
      expect(mocks.storage.upload).not.toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should throw NotFoundError when the file does not belong to the siniestro', async () => {
      await expect(service.getById('archivo-1', ownerScope)).rejects.toThrow(NotFoundError)
    })

    it('should return the file with a signed url', async () => {
      mocks.repo.findByIdForSiniestro.mockResolvedValue(createMockArchivo())

      const archivo = await service.getById('archivo-1', ownerScope)

      expect(archivo.id).toBe('archivo-1')
      expect(archivo.url).toContain('X-Amz-Signature')
      expect(mocks.repo.findByIdForSiniestro).toHaveBeenCalledWith('archivo-1', 'siniestro-1')
    })
  })

  describe('rename', () => {
    it('should only update the nombre', async () => {
      mocks.repo.findByIdForSiniestro.mockResolvedValue(createMockArchivo())

      await service.rename('archivo-1', ownerScope, 'Dictamen.pdf')

      expect(mocks.repo.update).toHaveBeenCalledWith('archivo-1', { nombre: 'Dictamen.pdf' })
    })

    it('should not rename a file that is not in the siniestro', async () => {
      await expect(service.rename('archivo-1', ownerScope, 'x.pdf')).rejects.toThrow(NotFoundError)
      expect(mocks.repo.update).not.toHaveBeenCalled()
    })
  })

  describe('softDelete', () => {
    it('should soft-delete the row and leave the binary in the storage', async () => {
      mocks.repo.findByIdForSiniestro.mockResolvedValue(createMockArchivo())

      await service.softDelete('archivo-1', ownerScope)

      expect(mocks.repo.softDelete).toHaveBeenCalledWith('archivo-1')
      expect(mocks.storage.delete).not.toHaveBeenCalled()
    })

    it('should not soft-delete a file that is not in the siniestro', async () => {
      await expect(service.softDelete('archivo-1', ownerScope)).rejects.toThrow(NotFoundError)
      expect(mocks.repo.softDelete).not.toHaveBeenCalled()
    })
  })
})
