#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Criando dados de teste para notificações...\n');

  try {
    // Limpar dados antigos
    console.log('🗑️  Limpando dados anteriores...');
    await prisma.cotacao.deleteMany({});
    await prisma.chat.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✓ Limpeza concluída\n');

    // Criar usuários de teste
    console.log('👤 Criando usuários de teste...');
    const embarcador = await prisma.user.create({
      data: {
        email: 'embarcador@test.com',
        password: 'test123456',
        nomeCompleto: 'Embarcador Test',
        userType: 'embarcador',
        cpfOuCnpj: '12345678901234',
        telefone: '1111111111',
      }
    });
    console.log(`   ✓ Embarcador criado: ${embarcador.email}`);

    const transportador = await prisma.user.create({
      data: {
        email: 'transportador@test.com',
        password: 'test123456',
        nomeCompleto: 'Transportador Test',
        userType: 'transportador',
        cpfOuCnpj: '98765432109876',
        telefone: '2222222222',
      }
    });
    console.log(`   ✓ Transportador criado: ${transportador.email}\n`);

    // Criar cotações com validade futura
    console.log('📦 Criando cotações de teste...');
    
    const dataHoraFim = new Date();
    dataHoraFim.setDate(dataHoraFim.getDate() + 7); // Válida por 7 dias
    
    const dataColeta = new Date();
    dataColeta.setDate(dataColeta.getDate() + 1);
    
    const cotacoes = [];
    for (let i = 1; i <= 3; i++) {
      const cotacao = await prisma.cotacao.create({
        data: {
          titulo: `Cotação #${i} - Produto ${i}`,
          descricao: `Descrição do produto para teste ${i}`,
          
          // Endereço de coleta
          cepColeta: '01310-100',
          enderecoColeta: `Rua ${i}, ${i}`,
          bairroColeta: 'Centro',
          cidadeColeta: i % 2 === 0 ? 'São Paulo' : 'Belo Horizonte',
          estadoColeta: i % 2 === 0 ? 'SP' : 'MG',
          dataColeta: dataColeta,
          
          // Endereço de entrega
          cepEntrega: '20040020',
          enderecoEntrega: `Avenida Rio Branco, ${i}`,
          bairroEntrega: 'Centro',
          cidadeEntrega: i % 2 === 0 ? 'Rio de Janeiro' : 'Brasília',
          estadoEntrega: i % 2 === 0 ? 'RJ' : 'DF',
          
          // Dados da cotação
          peso: 50 * i,
          altura: 10,
          largura: 20,
          profundidade: 15,
          dataHoraFim: dataHoraFim,
          userId: embarcador.id,
          status: 'aberta',
          createdAt: new Date(),
        }
      });
      cotacoes.push(cotacao);
      console.log(`   ✓ Cotação #${i} criada: ${cotacao.titulo} (válida até ${dataHoraFim.toLocaleDateString('pt-BR')})`);
    }

    console.log('\n✅ DADOS DE TESTE CRIADOS COM SUCESSO!\n');
    console.log('📊 Resumo:');
    console.log(`   • Embarcador: ${embarcador.email}`);
    console.log(`   • Transportador: ${transportador.email}`);
    console.log(`   • Cotações disponíveis: ${cotacoes.length}`);
    console.log(`   • Válidas até: ${dataHoraFim.toLocaleDateString('pt-BR')}\n`);
    
    console.log('🧪 Teste esperado:');
    console.log('   1. Faça login com transportador@test.com');
    console.log('   2. Dashboard deve mostrar 3 "Oportunidades Disponíveis"');
    console.log('   3. Sino do topo deve mostrar badge "3"');
    console.log('   4. Menu lateral deve mostrar "3" no Cotações\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
