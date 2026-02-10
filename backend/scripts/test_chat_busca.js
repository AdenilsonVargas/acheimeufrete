import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { listarChats } from '../src/controllers/chatController.js';

const prisma = new PrismaClient();

function mockReq(userId, busca = '') {
  return {
    query: { usuarioId: userId, limit: 50, busca },
    user: { id: userId }
  };
}

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

async function run() {
  console.log('== Teste de Busca em Chats ==');

  const embarcador = await prisma.user.findUnique({ where: { email: 'embarcador@test.com' } });
  if (!embarcador) throw new Error('Embarcador não encontrado. Execute o seed.');

  // Criar alguns produtos com NCMs variados
  await prisma.produto.deleteMany({ where: { userId: embarcador.id } });
  await prisma.produto.createMany({
    data: [
      {
        userId: embarcador.id,
        nome: 'Eletrônicos Premium',
        ncmCode: '85171231',
        ncmClassificacao: 'Eletrônicos',
        unidadeMedida: 'unidade',
        pesoKg: 5,
        valorUnitario: 1500
      },
      {
        userId: embarcador.id,
        nome: 'Ferramentas Industriais',
        ncmCode: '82079000',
        ncmClassificacao: 'Ferramentas',
        unidadeMedida: 'unidade',
        pesoKg: 10,
        valorUnitario: 500
      }
    ]
  });

  console.log('Produtos criados para teste de busca.');

  // Listar todos os chats
  const reqTodos = mockReq(embarcador.id);
  const resTodas = mockRes();
  await listarChats(reqTodos, resTodas);
  console.log('Total de chats:', resTodas.body?.length || 0);

  // Buscar por número da cotação
  const reqBuscaNumero = mockReq(embarcador.id, '2');
  const resBuscaNumero = mockRes();
  await listarChats(reqBuscaNumero, resBuscaNumero);
  console.log('Busca por número "2":', resBuscaNumero.body?.length || 0, 'resultados');

  // Buscar por NCM
  const reqBuscaNCM = mockReq(embarcador.id, '8517');
  const resBuscaNCM = mockRes();
  await listarChats(reqBuscaNCM, resBuscaNCM);
  console.log('Busca por NCM "8517":', resBuscaNCM.body?.length || 0, 'resultados');

  // Buscar por produto
  const reqBuscaProduto = mockReq(embarcador.id, 'Eletrônicos');
  const resBuscaProduto = mockRes();
  await listarChats(reqBuscaProduto, resBuscaProduto);
  console.log('Busca por produto "Eletrônicos":', resBuscaProduto.body?.length || 0, 'resultados');

  // Buscar por mensagem
  const reqBuscaMensagem = mockReq(embarcador.id, 'teste');
  const resBuscaMensagem = mockRes();
  await listarChats(reqBuscaMensagem, resBuscaMensagem);
  console.log('Busca por mensagem "teste":', resBuscaMensagem.body?.length || 0, 'resultados');

  console.log('== Teste Concluído ==');
}

run().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
