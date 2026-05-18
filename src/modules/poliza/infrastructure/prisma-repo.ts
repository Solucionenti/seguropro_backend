import type { Prisma } from '@gen/client'
import { ResourceStatus } from '@gen/enums'
import type { AppPrismaClient } from '@/config/database'
import { Page, type Pageable } from '@/shared/domain/pagination'
import type { CreatePolizaInput, PolizaWithDetails, UpdatePolizaInput } from '../domain/entities'
import type { PolizaFilters, PolizaRepository } from '../domain/repository'

const aseguradoraSelect = {
  id: true,
  companyId: true,
  nombre: true,
} as const

const ramoSelect = {
  id: true,
  companyId: true,
  nombre: true,
} as const

const clienteSelect = {
  id: true,
  companyId: true,
  firstName: true,
  lastName: true,
  email: true,
} as const

const includeDetails = {
  aseguradora: { select: aseguradoraSelect },
  ramo: { select: ramoSelect },
  cliente: { select: clienteSelect },
} as const

export class PrismaPolizaRepository implements PolizaRepository {
  constructor(private readonly prisma: AppPrismaClient) {}

  async findAll(pageable: Pageable, filters: PolizaFilters): Promise<Page<PolizaWithDetails>> {
    const where: Prisma.PolizaWhereInput = {
      companyId: filters.companyId,
      status: ResourceStatus.ACTIVE,
      active: true,
      ...(filters.clienteUserId && { clienteUserId: filters.clienteUserId }),
      ...(filters.aseguradoraId && { aseguradoraId: filters.aseguradoraId }),
      ...(filters.ramoId && { ramoId: filters.ramoId }),
      ...(filters.polizaStatus && { polizaStatus: filters.polizaStatus }),
      ...(filters.numeroPoliza && {
        numeroPoliza: { contains: filters.numeroPoliza, mode: 'insensitive' },
      }),
    }
    const [data, total] = await Promise.all([
      this.prisma.poliza.findMany({
        where,
        include: includeDetails,
        skip: pageable.skip,
        take: pageable.take,
        orderBy: pageable.orderBy,
      }),
      this.prisma.poliza.count({ where }),
    ])
    return Page.of(data, total, pageable)
  }

  async findById(
    id: string,
    companyId: string,
    clienteUserId?: string,
  ): Promise<PolizaWithDetails | null> {
    return this.prisma.poliza.findFirst({
      where: {
        id,
        companyId,
        status: ResourceStatus.ACTIVE,
        active: true,
        ...(clienteUserId && { clienteUserId }),
      },
      include: includeDetails,
    })
  }

  async findByNumeroAndCompany(
    numeroPoliza: string,
    companyId: string,
  ): Promise<PolizaWithDetails | null> {
    return this.prisma.poliza.findFirst({
      where: { numeroPoliza, companyId, status: ResourceStatus.ACTIVE, active: true },
      include: includeDetails,
    })
  }

  async create(input: CreatePolizaInput): Promise<PolizaWithDetails> {
    return this.prisma.poliza.create({
      data: {
        companyId: input.companyId,
        aseguradoraId: input.aseguradoraId,
        ramoId: input.ramoId,
        clienteUserId: input.clienteUserId,
        numeroPoliza: input.numeroPoliza,
        fechaInicio: input.fechaInicio,
        fechaVencimiento: input.fechaVencimiento,
        primaNeta: input.primaNeta,
        primaTotal: input.primaTotal,
        ...(input.polizaStatus && { polizaStatus: input.polizaStatus }),
      },
      include: includeDetails,
    })
  }

  async update(id: string, input: UpdatePolizaInput): Promise<PolizaWithDetails> {
    return this.prisma.poliza.update({
      where: { id },
      data: input,
      include: includeDetails,
    })
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.poliza.update({
      where: { id },
      data: { active: false },
    })
  }
}
