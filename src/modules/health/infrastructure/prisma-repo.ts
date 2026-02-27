import type { PrismaClient } from '../../../generated/prisma/client'
import type { HealthRepository } from '../domain/repository'

export class PrismaHealthRepository implements HealthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async checkDatabaseConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1')
      return true
    } catch {
      return false
    }
  }
}
