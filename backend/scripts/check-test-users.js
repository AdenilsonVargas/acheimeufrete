/**
 * Script para verificar e garantir que os usuários de teste existam
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkTestUsers() {
  console.log('🔍 Verificando usuários de teste...\n');

  try {
    // Verificar embarcador
    const embarcador = await prisma.user.findUnique({
      where: { email: 'embarcador@test.com' }
    });

    if (embarcador) {
      console.log('✅ Embarcador encontrado:');
      console.log(`   Email: ${embarcador.email}`);
      console.log(`   ID: ${embarcador.id}`);
      console.log(`   Tipo: ${embarcador.userType}`);
      console.log(`   Nome: ${embarcador.nomeCompleto || 'N/A'}\n`);
    } else {
      console.log('❌ Embarcador NÃO encontrado (embarcador@test.com)\n');
    }

    // Verificar transportador
    const transportador = await prisma.user.findUnique({
      where: { email: 'transportador_pj@test.com' }
    });

    if (transportador) {
      console.log('✅ Transportador encontrado:');
      console.log(`   Email: ${transportador.email}`);
      console.log(`   ID: ${transportador.id}`);
      console.log(`   Tipo: ${transportador.userType}`);
      console.log(`   Nome: ${transportador.nomeCompleto || 'N/A'}\n`);
    } else {
      console.log('❌ Transportador NÃO encontrado (transportador_pj@test.com)\n');
    }

    // Listar todos os usuários
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        userType: true,
        nomeCompleto: true,
        createdAt: true
      }
    });

    console.log(`📊 Total de usuários no banco: ${allUsers.length}\n`);
    
    if (allUsers.length > 0) {
      console.log('👥 Lista de todos os usuários:');
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.userType}) - ${user.nomeCompleto || 'Sem nome'}`);
      });
    }

    console.log('\n✅ Verificação concluída!\n');

  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestUsers();
