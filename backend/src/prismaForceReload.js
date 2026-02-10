// Force reload do Prisma Client
// Este arquivo é importado ao iniciar para garantir que o Prisma está sincronizado
delete require.cache[require.resolve('@prisma/client')];
const { PrismaClient } = require('@prisma/client');

console.log('🔄 Prisma Client force-reloaded at:', new Date().toISOString());

module.exports = { PrismaClient };
