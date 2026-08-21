import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { NotificacionService } from '@/modules/notificacion/application/service'
import type { PolizaPorVencer } from '@/modules/notificacion/domain/entities'
import type { PolizaVencimientoProvider } from '@/modules/notificacion/domain/poliza-vencimiento-provider'
import type { NotificacionRepository } from '@/modules/notificacion/domain/repository'
import type { EmailSender } from '@/shared/domain/email-sender'
import type { Mocked } from '../../../utils/mocked'

const HOY = new Date('2026-08-21T00:00:00.000Z')

function createPoliza(overrides: Partial<PolizaPorVencer> = {}): PolizaPorVencer {
  return {
    id: 'poliza-1',
    companyId: 'company-1',
    numeroPoliza: 'POL-001',
    fechaVencimiento: new Date('2026-09-20T00:00:00.000Z'),
    aseguradoraNombre: 'GNP',
    clienteNombre: 'Ana Lopez',
    ownerEmail: 'owner@empresa.test',
    ownerFirstName: 'Demi',
    umbralDias: 30,
    diasRestantes: 30,
    ...overrides,
  }
}

function createMocks() {
  const polizaProvider: Mocked<PolizaVencimientoProvider> = {
    findPorVencer: mock(() => Promise.resolve([] as PolizaPorVencer[])),
    marcarProximaAVencer: mock(() => Promise.resolve()),
  }
  const repo: Mocked<NotificacionRepository> = {
    registrarSiEsNueva: mock(() => Promise.resolve(true)),
  }
  const emailSender: Mocked<EmailSender> = {
    sendPasswordReset: mock(() => Promise.resolve()),
    sendPolizaPorVencer: mock(() => Promise.resolve()),
  }
  return { polizaProvider, repo, emailSender }
}

describe('NotificacionService', () => {
  let service: NotificacionService
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    mocks = createMocks()
    service = new NotificacionService(mocks.polizaProvider, mocks.repo, mocks.emailSender, {
      appUrl: 'https://app.test',
    })
  })

  it('should do nothing when no poliza reaches a threshold', async () => {
    const resumen = await service.notificarPolizasPorVencer(HOY)

    expect(resumen).toEqual({
      revisadas: 0,
      notificadas: 0,
      omitidasPorDuplicado: 0,
      fallidas: 0,
    })
    expect(mocks.emailSender.sendPolizaPorVencer).not.toHaveBeenCalled()
  })

  it('should flip the poliza to PROXIMA_A_VENCER and mail the owner', async () => {
    mocks.polizaProvider.findPorVencer.mockResolvedValue([createPoliza()])

    const resumen = await service.notificarPolizasPorVencer(HOY)

    expect(mocks.polizaProvider.marcarProximaAVencer).toHaveBeenCalledWith('poliza-1')
    expect(mocks.emailSender.sendPolizaPorVencer).toHaveBeenCalledTimes(1)
    expect(mocks.emailSender.sendPolizaPorVencer.mock.calls[0]?.[0]).toMatchObject({
      to: 'owner@empresa.test',
      numeroPoliza: 'POL-001',
      diasRestantes: 30,
      detalleUrl: 'https://app.test/polizas/poliza-1',
    })
    expect(resumen.notificadas).toBe(1)
  })

  // RF-POL-NOTIF-01: "evitar duplicidad: no enviar el mismo correo multiples veces"
  it('should not resend when the threshold was already recorded', async () => {
    mocks.polizaProvider.findPorVencer.mockResolvedValue([createPoliza()])
    mocks.repo.registrarSiEsNueva.mockResolvedValue(false)

    const resumen = await service.notificarPolizasPorVencer(HOY)

    expect(mocks.emailSender.sendPolizaPorVencer).not.toHaveBeenCalled()
    expect(mocks.polizaProvider.marcarProximaAVencer).not.toHaveBeenCalled()
    expect(resumen).toMatchObject({ revisadas: 1, notificadas: 0, omitidasPorDuplicado: 1 })
  })

  it('should record the threshold, not just the poliza, so each threshold fires once', async () => {
    mocks.polizaProvider.findPorVencer.mockResolvedValue([
      createPoliza({ umbralDias: 7, diasRestantes: 7 }),
    ])

    await service.notificarPolizasPorVencer(HOY)

    expect(mocks.repo.registrarSiEsNueva).toHaveBeenCalledWith('POLIZA_POR_VENCER', 'poliza-1', '7')
  })

  it('should keep going when one send fails', async () => {
    mocks.polizaProvider.findPorVencer.mockResolvedValue([
      createPoliza({ id: 'poliza-1' }),
      createPoliza({ id: 'poliza-2' }),
      createPoliza({ id: 'poliza-3' }),
    ])
    mocks.emailSender.sendPolizaPorVencer.mockImplementation((input) =>
      input.numeroPoliza === 'POL-001' &&
      mocks.emailSender.sendPolizaPorVencer.mock.calls.length === 2
        ? Promise.reject(new Error('bad address'))
        : Promise.resolve(),
    )

    const resumen = await service.notificarPolizasPorVencer(HOY)

    expect(resumen.revisadas).toBe(3)
    expect(resumen.notificadas + resumen.fallidas).toBe(3)
    expect(resumen.fallidas).toBe(1)
  })

  it('should count a failed send as failed, not as notified', async () => {
    mocks.polizaProvider.findPorVencer.mockResolvedValue([createPoliza()])
    mocks.emailSender.sendPolizaPorVencer.mockRejectedValue(new Error('resend down'))

    const resumen = await service.notificarPolizasPorVencer(HOY)

    expect(resumen).toMatchObject({ revisadas: 1, notificadas: 0, fallidas: 1 })
  })
})
