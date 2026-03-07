import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'MASTER_ADMIN', status: 'ACTIVE' },
  })

  if (existingAdmin) {
    console.log('✅ System admin already exists, skipping seed.')
    return
  }

  const passwordHash = await Bun.password.hash('Admin123!', {
    algorithm: 'argon2id',
    memoryCost: 65536,
    timeCost: 3,
  })

  const admin = await prisma.user.create({
    data: {
      role: 'MASTER_ADMIN',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@segurpro.com',
      phone: '+520000000000',
      passwordHash,
      companyId: null,
    },
  })

  console.log(`🌱 Created system MASTER_ADMIN: ${admin.email} (id: ${admin.id})`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
