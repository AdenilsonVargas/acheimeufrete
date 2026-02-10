/**
 * Configuração de Database (Prisma)
 * DEPRECATED: Use src/utils/prismaClient.js em vez disso
 * Exporta a mesma instância singleton para compatibilidade retroativa
 */

import prisma from '../utils/prismaClient.js';

export { prisma };

