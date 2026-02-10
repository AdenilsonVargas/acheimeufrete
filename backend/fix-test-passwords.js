#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Verificando e atualizando senhas de teste...\n');

  try {
    // Atualizar transportador com a senha correta
    const senhaHash = await bcryptjs.hash('123456', 10);
    
    const transportador = await prisma.user.update({
      where: { email: 'transportador@test.com' },
      data: { password: senhaHash }
    });

    console.log('✅ Transportador atualizado:');
    console.log(`   Email: ${transportador.email}`);
    console.log(`   Senha: 123456`);
    console.log(`   Hash: ${transportador.password.substring(0, 20)}...\n`);

    // Atualizar embarcador também
    const senhaHash2 = await bcryptjs.hash('123456', 10);
    const embarcador = await prisma.user.update({
      where: { email: 'embarcador@test.com' },
      data: { password: senhaHash2 }
    });

    console.log('✅ Embarcador atualizado:');
    console.log(`   Email: ${embarcador.email}`);
    console.log(`   Senha: 123456`);
    console.log(`   Hash: ${embarcador.password.substring(0, 20)}...\n`);

    console.log('✅ Credenciais de teste atualizadas!');
    console.log('\n📝 Use para testar:');
    console.log('   Transportador: transportador@test.com / 123456');
    console.log('   Embarcador: embarcador@test.com / 123456\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
