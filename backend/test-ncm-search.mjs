import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSearchNCMs() {
  console.log('🧪 Testando busca de NCMs...\n');

  // Teste 1: Buscar com 4 dígitos
  console.log('✅ TESTE 1: Buscar com 4 dígitos (0101)');
  const test1 = await prisma.nCM.findMany({
    where: {
      OR: [
        { codigo: { startsWith: '0101' } },
        { descricao: { contains: '0101', mode: 'insensitive' } },
      ],
    },
    take: 5,
    select: { codigo: true, descricao: true, classificacao: true, caracteristicas: true },
  });
  console.log(`Encontrados: ${test1.length}`);
  test1.forEach(ncm => {
    console.log(`  ${ncm.codigo}: ${ncm.descricao.substring(0, 50)}...`);
    if (ncm.caracteristicas?.length > 0) {
      console.log(`    Características: ${ncm.caracteristicas.join(', ')}`);
    }
  });

  // Teste 2: Buscar por descrição
  console.log('\n✅ TESTE 2: Buscar por descrição (motor)');
  const test2 = await prisma.nCM.findMany({
    where: {
      descricao: { contains: 'motor', mode: 'insensitive' },
    },
    take: 5,
    select: { codigo: true, descricao: true, classificacao: true, caracteristicas: true },
  });
  console.log(`Encontrados: ${test2.length}`);
  test2.forEach(ncm => {
    console.log(`  ${ncm.codigo}: ${ncm.descricao.substring(0, 50)}...`);
  });

  // Teste 3: Buscar por termo genérico
  console.log('\n✅ TESTE 3: Buscar por termo (alimentos)');
  const test3 = await prisma.nCM.findMany({
    where: {
      descricao: { contains: 'alimento', mode: 'insensitive' },
    },
    take: 5,
    select: { codigo: true, descricao: true, classificacao: true, caracteristicas: true },
  });
  console.log(`Encontrados: ${test3.length}`);
  test3.forEach(ncm => {
    console.log(`  ${ncm.codigo}: ${ncm.descricao.substring(0, 50)}...`);
  });

  // Teste 4: Verificar características inferidas
  console.log('\n✅ TESTE 4: NCMs com características inferidas');
  const test4 = await prisma.nCM.findMany({
    where: {
      caracteristicas: { hasSome: ['perecivel', 'quimico', 'liquido'] },
    },
    take: 5,
    select: { codigo: true, descricao: true, classificacao: true, caracteristicas: true },
  });
  console.log(`Encontrados: ${test4.length}`);
  test4.forEach(ncm => {
    console.log(`  ${ncm.codigo}: ${ncm.descricao.substring(0, 50)}...`);
    console.log(`    Características: [${ncm.caracteristicas.join(', ')}]`);
  });

  // Teste 5: Total de NCMs
  console.log('\n✅ TESTE 5: Total de NCMs no banco');
  const total = await prisma.nCM.count();
  const comCaracteristicas = await prisma.nCM.count({
    where: {
      caracteristicas: { hasSome: ['perecivel'] },
    },
  });
  console.log(`  Total: ${total}`);
  console.log(`  Com características: ${comCaracteristicas}`);

  // Teste 6: Exemplo NCM com todas as informações
  console.log('\n✅ TESTE 6: Exemplo de NCM completo');
  const exemplo = await prisma.nCM.findFirst({
    select: { codigo: true, descricao: true, classificacao: true, caracteristicas: true },
  });
  if (exemplo) {
    console.log(`  Código: ${exemplo.codigo}`);
    console.log(`  Descrição: ${exemplo.descricao}`);
    console.log(`  Classificação: ${exemplo.classificacao}`);
    console.log(`  Características: ${JSON.stringify(exemplo.caracteristicas)}`);
  }

  console.log('\n✅ Todos os testes concluídos!');
  await prisma.$disconnect();
}

testSearchNCMs().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
