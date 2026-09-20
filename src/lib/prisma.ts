import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const databaseUrl = process.env.DATABASE_URL?.trim()

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is missing. Configure a shared Postgres connection string before using Prisma.',
  )
}

if (process.env.NODE_ENV === 'production' && databaseUrl.startsWith('file:')) {
  throw new Error(
    'DATABASE_URL must point to a shared Postgres database in production. File-based SQLite is not supported on Vercel for auth and automation writes.',
  )
}

const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString: databaseUrl })

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  })
}

export const prisma = global.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
