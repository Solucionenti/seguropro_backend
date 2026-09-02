import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const ADMIN_EMAIL = 'admin@segurpro.com'
const ADMIN_PASSWORD = 'Admin123!'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function seedSystemAdmin(): Promise<void> {
  // keyed on identity and NOT on status: a MASTER_ADMIN has companyId null, and postgres
  // treats nulls as distinct, so @@unique([companyId, email]) does not stop a second row.
  // filtering by status: ACTIVE here would create a duplicate admin on the next run
  const existing = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL, companyId: null },
    select: { id: true, status: true },
  })

  if (existing?.status === 'ACTIVE') {
    console.log(`✅ system admin ${ADMIN_EMAIL} already active, nothing to do`)
    return
  }

  if (existing) {
    // deactivating the platform admin is a deliberate act; the seed must not undo it
    console.warn(
      `⚠️  system admin ${ADMIN_EMAIL} exists with status ${existing.status}. Leaving it alone — reactivate it by hand if that was not intended.`,
    )
    return
  }

  const passwordHash = await Bun.password.hash(ADMIN_PASSWORD, {
    algorithm: 'argon2id',
    memoryCost: 65536,
    timeCost: 3,
  })

  const admin = await prisma.user.create({
    data: {
      role: 'MASTER_ADMIN',
      firstName: 'System',
      lastName: 'Admin',
      email: ADMIN_EMAIL,
      phone: '+520000000000',
      passwordHash,
      companyId: null,
    },
  })

  console.log(`🌱 Created system MASTER_ADMIN: ${admin.email} (id: ${admin.id})`)
}

// every seeder here MUST be safe to re-run: this runs on every deploy when SEED_ON_DEPLOY is set
async function main(): Promise<void> {
  await seedSystemAdmin()
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
