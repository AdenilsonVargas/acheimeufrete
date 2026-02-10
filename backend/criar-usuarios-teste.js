import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function criarUsuariosTeste() {
  console.log('🌱 Criando usuários de teste...\n');

  try {
    // Criar admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        password: await bcrypt.hash('123456', 10),
        nomeCompleto: 'Admin Test',
        userType: 'admin',
      }
    });
    console.log('✅ Admin pronto:', admin.email);

    // Criar embarcador
    const embarcador = await prisma.user.upsert({
      where: { email: 'embarcador@test.com' },
      update: {},
      create: {
        email: 'embarcador@test.com',
        password: await bcrypt.hash('123456', 10),
        nomeCompleto: 'João Silva Embarcador',
        userType: 'embarcador',
        cpfOuCnpj: '12345678901234',
        telefone: '11987654321',
        razaoSocial: 'Empresa Embarcadora LTDA',
        perfil: {
          create: {
            numeroTaxasAceitas: 0,
            taxaMedia: 0,
            avaliacaoMedia: 5
          }
        }
      }
    });
    console.log('✅ Embarcador pronto:', embarcador.email);

    // Criar transportador PJ
    const transportador = await prisma.user.upsert({
      where: { email: 'transportador@test.com' },
      update: {},
      create: {
        email: 'transportador@test.com',
        password: await bcrypt.hash('123456', 10),
        nomeCompleto: 'Transportador Teste',
        userType: 'transportador',
        cpfOuCnpj: '98765432109876',
        telefone: '11988888888',
        razaoSocial: 'Transportadora XYZ',
        perfilTransportadora: {
          create: {
            avaliacaoMedia: 5,
            statusVerificacao: 'verificado'
          }
        }
      }
    });
    console.log('✅ Transportador pronto:', transportador.email);

    // Criar transportador Autônomo
    const autonomo = await prisma.user.upsert({
      where: { email: 'autonomo@test.com' },
      update: {},
      create: {
        email: 'autonomo@test.com',
        password: await bcrypt.hash('123456', 10),
        nomeCompleto: 'João Autônomo',
        userType: 'transportador',
        cpfOuCnpj: '12345678901234',
        telefone: '11999999999',
        perfilTransportadora: {
          create: {
            avaliacaoMedia: 5,
            statusVerificacao: 'verificado'
          }
        }
      }
    });
    console.log('✅ Transportador Autônomo pronto:', autonomo.email);

    console.log('\n✨ Usuários de teste prontos!\n');
    console.log('📋 Credenciais:');
    console.log('   Embarcador: embarcador@test.com / 123456');
    console.log('   Transportador PJ: transportador@test.com / 123456');
    console.log('   Transportador Autônomo: autonomo@test.com / 123456\n');

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

criarUsuariosTeste();
