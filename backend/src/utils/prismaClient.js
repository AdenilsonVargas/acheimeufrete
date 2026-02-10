import { PrismaClient } from '@prisma/client';

/**
 * Singleton de PrismaClient para evitar múltiplas instâncias
 * Múltiplas instâncias causam cache de schema, levando a erros de enum
 */

const globalForPrisma = global;

if (!globalForPrisma.prisma) {
  const logLevel = process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'];
  
  globalForPrisma.prisma = new PrismaClient({
    log: logLevel,
    errorFormat: 'pretty',
  });
  
  console.log('✅ PrismaClient inicializado com sucesso (singleton global)');
}

const prisma = globalForPrisma.prisma;

// Logging de conexão
prisma.$on('query', (e) => {
  if (process.env.DEBUG_PRISMA === 'true') {
    console.log('Query:', e.query, '\n\nParams:', e.params, '\n\nDuration:', e.duration, 'ms');
  }
});

prisma.$on('error', (e) => {
  console.error('🔴 Prisma Error:', e.message);
});

export default prisma;
