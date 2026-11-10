import { PrismaClient } from '@/src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // DATABASE_URL should point at the Supabase transaction pooler (port 6543).
  // Keep the per-instance pool tiny: each serverless instance opens its own pool.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX) || (process.env.NODE_ENV === 'production' ? 2 : 5),
  })
  return new PrismaClient({ adapter, log: ['error', 'warn'] })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
